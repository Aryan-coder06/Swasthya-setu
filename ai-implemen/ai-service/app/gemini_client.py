# app/gemini_client.py
import os
import base64
import hashlib
import json
import time
import random
import re
from io import BytesIO
from typing import Tuple, Dict, Any, Optional, List, Type

from PIL import Image
from dotenv import load_dotenv
from pydantic import BaseModel, ValidationError

from google import genai
from google.genai import types
from google.genai.errors import APIError as GeminiAPIError

from app.schemas import (
    PrescriptionData,
    PatientReportAI,
    PatientReport,
    StructuredPrescriptionRequest,
)

# --------------------------------------------------------------------
# Runtime setup
# --------------------------------------------------------------------
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
VISION_MODEL = os.getenv("GEMINI_VISION_MODEL", "gemini-2.5-flash")
TEXT_ANALYSIS_MODEL = os.getenv("GEMINI_TEXT_MODEL", "gemini-2.5-flash")

client: Optional[genai.Client] = None
if API_KEY:
    try:
        client = genai.Client(api_key=API_KEY)
    except Exception as e:
        print(f"[gemini] Warning: failed to init client: {e}")
        client = None

_EXTRACT_CACHE: Dict[str, Dict[str, Any]] = {}
_SYNTHESIZE_CACHE: Dict[str, Dict[str, Any]] = {}


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def downscale_for_ocr(img: Image.Image, max_side: int = 1280) -> Image.Image:
    w, h = img.size
    if max(w, h) <= max_side:
        return img
    if w >= h:
        new_w = max_side
        new_h = int(h * (max_side / w))
    else:
        new_h = max_side
        new_w = int(w * (max_side / h))
    return img.resize((new_w, new_h), Image.LANCZOS)

def pil_to_png_bytes(img: Image.Image) -> bytes:
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")
    buf = BytesIO()
    img.save(buf, format="PNG", optimize=False)
    return buf.getvalue()

def make_image_part_from_pil(img: Image.Image) -> types.Part:
    png_bytes = pil_to_png_bytes(img)
    return types.Part(inline_data=types.Blob(mime_type="image/png", data=png_bytes))

def make_text_part(text: str) -> types.Part:
    return types.Part(text=text)

def _parse_retry_after_seconds(err: Exception) -> Optional[float]:
    try:
        s = str(err)
        m = re.search(r'"retryDelay"\s*:\s*"(\d+)s"', s)
        if m:
            return float(m.group(1))
    except Exception:
        pass
    return None

def _coerce_json_only(text: str) -> str:
    s = text.strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s, flags=re.IGNORECASE)
        s = re.sub(r"\s*```$", "", s).strip()
    try:
        json.loads(s)
        return s
    except Exception:
        pass
    m = re.search(r"(\{.*\}|\[.*\])", s, flags=re.DOTALL)
    if m:
        candidate = m.group(1)
        json.loads(candidate)
        return candidate
    return s

def _retry_generate_content(
    model: str,
    contents: List[types.Content],
    response_mime_type: str = "application/json",
    max_attempts: int = 3,
) -> str:
    if client is None:
        raise RuntimeError("Gemini client not initialized (GEMINI_API_KEY missing or init failed).")
    attempt = 0
    base_sleep = 1.5
    while True:
        attempt += 1
        try:
            resp = client.models.generate_content(
                model=model,
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type=response_mime_type,
                ),
            )
            text = resp.text or ""
            if not text.strip():
                raise RuntimeError("Empty response from model.")
            return text
        except GeminiAPIError as e:
            msg = str(e)
            status_code = getattr(e, "status_code", None)
            retryable = (
                any(token in msg for token in ("RESOURCE_EXHAUSTED", "429", "UNAVAILABLE", "overloaded"))
                or status_code in {429, 503}
            )
            if retryable and attempt < max_attempts:
                retry_after = _parse_retry_after_seconds(e) or (base_sleep * (2 ** (attempt - 1)))
                retry_after += random.uniform(0, 0.4)
                time.sleep(retry_after)
                continue
            raise

# ---------------- Coercion helpers for AI output ----------------
def _stringify_summary_header(val) -> str:
    if isinstance(val, str):
        return val.strip()
    if isinstance(val, dict):
        parts = []
        # common keys first
        for k in ("headline", "title", "text", "summary", "message"):
            v = val.get(k)
            if isinstance(v, str) and v.strip():
                parts.append(v.strip())
        if not parts:
            for v in val.values():
                if isinstance(v, str) and v.strip():
                    parts.append(v.strip())
        return (" ".join(parts) or "Prescription Summary")[:400]
    return "Prescription Summary"

def _infer_color_from_title(title: str) -> str:
    t = (title or "").lower()
    if any(x in t for x in ("red", "urgent", "critical", "risk")):
        return "red"
    if any(x in t for x in ("yellow", "caution", "reminder", "monitor")):
        return "yellow"
    if any(x in t for x in ("green", "general", "routine", "wellness", "info")):
        return "green"
    return "yellow"

def coerce_patient_report_ai_dict(d: dict) -> dict:
    """
    Fix common Gemini drift so it validates against PatientReportAI:
    - summary_header: ensure string (not object)
    - report_sections[*]: map section_name->title, add/infer color, ensure items is list[str]
    """
    if not isinstance(d, dict):
        return d

    d["summary_header"] = _stringify_summary_header(d.get("summary_header", ""))

    sections = d.get("report_sections")
    if isinstance(sections, list):
        fixed = []
        for sec in sections:
            if not isinstance(sec, dict):
                continue
            # map alternate keys
            title = sec.get("title") or sec.get("section_name") or sec.get("name") or "Section"
            color = sec.get("color")
            if not isinstance(color, str) or color not in ("red", "yellow", "green"):
                color = _infer_color_from_title(title)

            items = sec.get("items") or sec.get("summary") or sec.get("points") or []
            if isinstance(items, str):
                items = [items]
            if isinstance(items, list):
                items = [x for x in items if isinstance(x, str)]
            else:
                items = []

            fixed.append({"title": title, "color": color, "items": items})
        d["report_sections"] = fixed
    return d
# --------------------------------------------------------------------

def _generate_json_with_schema(
    model_name: str,
    prompt: str,
    schema: Type[BaseModel],
    image: Optional[Image.Image] = None,
    cache: Optional[Dict[str, Dict[str, Any]]] = None,
    cache_key: Optional[str] = None,
) -> Tuple[Dict[str, Any], str]:
    if cache is not None and cache_key and cache_key in cache:
        return cache[cache_key], "Cached"

    parts: List[types.Part] = []
    if image is not None:
        parts.append(make_image_part_from_pil(image))
    parts.append(make_text_part(prompt))

    contents = [types.Content(role="user", parts=parts)]
    raw_text = _retry_generate_content(
        model=model_name,
        contents=contents,
        response_mime_type="application/json",
        max_attempts=3,
    )
    json_text = _coerce_json_only(raw_text)

    try:
        parsed = schema.model_validate_json(json_text)
        data = parsed.model_dump()
        if cache is not None and cache_key:
            cache[cache_key] = data
        return data, json_text

    except ValidationError as ve:
        # If the schema is PatientReportAI, try coercion once
        try:
            from app.schemas import PatientReportAI  # local import to avoid cycles
            if schema is PatientReportAI:
                loose = json.loads(json_text)
                coerced = coerce_patient_report_ai_dict(loose)
                parsed2 = schema.model_validate(coerced)
                data2 = parsed2.model_dump()
                if cache is not None and cache_key:
                    cache[cache_key] = data2
                return data2, json_text
        except Exception:
            pass
        return {"error": f"Pydantic validation failed: {ve}"}, json_text
    except Exception as e:
        return {"error": f"JSON parse/validate error: {type(e).__name__}: {e}"}, json_text

# --------------------------------------------------------------------
# Public orchestrator
# --------------------------------------------------------------------
def analyze_prescription_image(base64_image: str) -> Tuple[Dict[str, Any], str]:
    if client is None or not API_KEY:
        return {"error": "API Key Missing: set GEMINI_API_KEY and restart."}, "Init Error"

    # Decode
    try:
        image_bytes = base64.b64decode(base64_image)
        img = Image.open(BytesIO(image_bytes))
    except Exception as e:
        return {"error": f"Invalid image input: {e}"}, "Decode Error"

    # Preprocess
    try:
        img = downscale_for_ocr(img, max_side=1280)
        image_hash = sha256_hex(pil_to_png_bytes(img))
    except Exception as e:
        return {"error": f"Image processing failed: {e}"}, "Preprocess Error"

    # -------- Extraction (Vision) --------
    extraction_prompt = (
        "You are an expert medical transcription system. Extract structured JSON from the prescription image.\n"
        "Rules:\n"
        " - Return ONLY JSON with these keys (include keys even if null/empty):\n"
        "   hospital_name, doctor_name, patient_name, patient_id, date_issued,\n"
        "   vitals (object), diseases_diagnoses (array), medications (array), treatment_notes, precautions, raw_lines (array)\n"
        " - Do NOT invent data.\n"
    )

    extracted_dict, extraction_raw = _generate_json_with_schema(
        model_name=VISION_MODEL,
        prompt=extraction_prompt,
        schema=PrescriptionData,
        image=img,
        cache=_EXTRACT_CACHE,
        cache_key=image_hash,
    )
    if "error" in extracted_dict:
        return {"error": extracted_dict["error"], "provider_raw": extraction_raw[:4000]}, "Extraction Error"

    try:
        extracted_obj = PrescriptionData(**extracted_dict)
        extracted_json = extracted_obj.model_dump_json()
    except ValidationError as ve:
        return {"error": f"Post-extraction validation failed: {ve}"}, "Extraction Validate Error"

    # -------- Synthesis (Text) --------
    synth_key = sha256_hex((image_hash + "|" + extracted_json).encode("utf-8"))

    # Mini schema + example to reduce drift
    synthesis_prompt = (
        "You are a medical summarization assistant.\n"
        "Using the RAW prescription JSON below, produce a patient-friendly JSON that matches this EXACT schema:\n"
        "PatientReportAI {\n"
        '  "summary_header": string,\n'
        '  "report_sections": [\n'
        '    { "title": string, "color": "red" | "yellow" | "green", "items": [string, ...] }, ...\n'
        "  ]\n"
        "}\n"
        "Hard rules:\n"
        " - summary_header MUST be a STRING (not an object)\n"
        " - Each report_sections[i] MUST contain: title(string), color(one of red|yellow|green), items(array of strings)\n"
        " - If unsure which color → use \"yellow\"\n"
        " - Do NOT include 'raw_extracted_data' in your output\n"
        "Return ONLY JSON (no markdown fences, no extra text).\n\n"
        "Example OUTPUT:\n"
        '{\n'
        '  "summary_header": "Your prescription has been summarized for easy understanding.",\n'
        '  "report_sections": [\n'
        '    { "title": "RED — Urgent Items", "color": "red", "items": ["Do not mix two NSAIDs", "Seek help if bleeding"] },\n'
        '    { "title": "YELLOW — Caution", "color": "yellow", "items": ["Paracetamol near daily max", "Avoid alcohol"] },\n'
        '    { "title": "GREEN — General Info", "color": "green", "items": ["Stay hydrated", "Follow dosage schedule"] }\n'
        '  ]\n'
        '}\n\n'
        f"RAW JSON:\n{extracted_json}"
    )

    ai_report_dict, synthesis_raw = _generate_json_with_schema(
        model_name=TEXT_ANALYSIS_MODEL,
        prompt=synthesis_prompt,
        schema=PatientReportAI,
        image=None,
        cache=_SYNTHESIZE_CACHE,
        cache_key=synth_key,
    )
    if "error" in ai_report_dict:
        return {"error": ai_report_dict["error"], "provider_raw": synthesis_raw[:4000]}, "Synthesis Error"

    # -------- Promote → PatientReport --------
    try:
        final_payload = {**ai_report_dict, "raw_extracted_data": extracted_dict}
        final_report = PatientReport(**final_payload)
        return final_report.model_dump(), "Success"
    except ValidationError as ve:
        return {
            "error": f"Final report validation failed: {ve}",
            "ai_report_preview": json.dumps(ai_report_dict, ensure_ascii=False)[:2000],
        }, "Promotion Error"
    except Exception as e:
        return {"error": f"Unexpected error promoting report: {e}"}, "Promotion Error"


def analyze_prescription_structured(request: StructuredPrescriptionRequest) -> Tuple[Dict[str, Any], str]:
    from app.schemas import PatientReport  # avoid circular import

    if client is None or not API_KEY:
        return {"error": "API Key Missing: set GEMINI_API_KEY and restart."}, "Init Error"

    structured = request.model_dump()
    medications = structured.get("medications", [])
    raw_structured = {
        "hospital_name": None,
        "doctor_name": structured.get("doctor_name"),
        "patient_name": structured.get("patient_name"),
        "patient_id": structured.get("patient_id"),
        "date_issued": structured.get("date_issued"),
        "vitals": structured.get("vitals"),
        "diseases_diagnoses": structured.get("diseases_diagnoses") or [],
        "medications": medications,
        "treatment_notes": structured.get("notes"),
        "precautions": structured.get("precautions"),
        "raw_lines": [],
    }

    synthesis_prompt = (
        "You are a clinical AI assistant. Convert the structured prescription data provided below into a patient-friendly JSON summary.\n"
        "Return ONLY JSON with this exact shape:\n"
        "{\n"
        '  "summary_header": string,\n'
        '  "report_sections": [\n'
        '    { "title": string, "color": "red" | "yellow" | "green", "items": [string, ...] }, ...\n'
        "  ],\n"
        '  "patient_name": string?,\n'
        '  "doctor_name": string?,\n'
        '  "date_issued": string?\n'
        "}\n"
        "Guidelines:\n"
        "- Use the structured data precisely—do not invent medications or conditions.\n"
        "- Highlight unresolved risks, adherence reminders, and monitoring needs.\n"
        "- Use red for urgent concerns, yellow for cautionary monitoring, green for routine or positive notes.\n"
        "- If notes mention follow-up, include it in the appropriate section.\n\n"
        f"STRUCTURED DATA:\n{json.dumps(structured, ensure_ascii=False, indent=2)}\n"
    )

    ai_report_dict, synthesis_raw = _generate_json_with_schema(
        model_name=TEXT_ANALYSIS_MODEL,
        prompt=synthesis_prompt,
        schema=PatientReportAI,
        cache=None,
        cache_key=sha256_hex(json.dumps(structured, sort_keys=True).encode("utf-8")),
    )
    if "error" in ai_report_dict:
        return {"error": ai_report_dict["error"], "provider_raw": synthesis_raw[:4000]}, "Synthesis Error"

    try:
        final_payload = {**ai_report_dict, "raw_extracted_data": raw_structured}
        final_report = PatientReport(**final_payload)
        return final_report.model_dump(), "Success"
    except ValidationError as ve:
        return {
            "error": f"Final report validation failed: {ve}",
            "ai_report_preview": json.dumps(ai_report_dict, ensure_ascii=False)[:2000],
        }, "Promotion Error"
    except Exception as e:
        return {"error": f"Unexpected error promoting report: {e}"}, "Promotion Error"
