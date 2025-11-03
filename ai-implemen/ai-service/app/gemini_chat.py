# app/gemini_chat.py
import os, json, re, time, random, hashlib
from typing import List, Dict, Tuple, Optional
import textwrap


from dotenv import load_dotenv
from pydantic import ValidationError
from google import genai
from google.genai import types
from google.genai.errors import APIError as GeminiAPIError

from app.chat_schemas import (
    ChatMessageIn,
    ChatMessageOut,
    ChatAIResponse,
    ChatPatientContext,
    ChatAttachment,
)
from app.gemini_client import analyze_prescription_image

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
CHAT_MODEL = os.getenv("GEMINI_CHAT_MODEL", "gemini-2.5-flash")  # fast + cheap; swap to pro if needed

_client: Optional[genai.Client] = None
if API_KEY:
    try:
        _client = genai.Client(api_key=API_KEY)
    except Exception as e:
        print("[chat] Gemini init failed:", e)
        _client = None

def _only_json(text: str) -> str:
    s = text.strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s, flags=re.I)
        s = re.sub(r"\s*```$", "", s).strip()
    # try direct parse
    try:
        json.loads(s); return s
    except Exception:
        pass
    m = re.search(r"(\{.*\})", s, flags=re.S)
    if m:
        candidate = m.group(1)
        json.loads(candidate)
        return candidate
    return s

def _backoff_generate(contents: List[types.Content], response_mime_type="application/json") -> str:
    if _client is None:
        raise RuntimeError("Gemini client not initialized. Set GEMINI_API_KEY.")
    attempts, base_sleep = 0, 1.5
    while True:
        attempts += 1
        try:
            r = _client.models.generate_content(
                model=CHAT_MODEL,
                contents=contents,
                config=types.GenerateContentConfig(response_mime_type=response_mime_type),
            )
            if not r.text or not r.text.strip():
                raise RuntimeError("Empty response from model.")
            return r.text
        except GeminiAPIError as e:
            msg = str(e)
            if ("RESOURCE_EXHAUSTED" in msg or "429" in msg) and attempts < 3:
                time.sleep(base_sleep * (2 ** (attempts - 1)) + random.uniform(0, 0.4))
                continue
            raise

SYSTEM_GUARDRAILS = """\
You are a medical information assistant for India (IN). You provide general education, triage suggestions,
and guidance. HARD RULES:
- You are NOT a doctor; include a brief disclaimer in 'disclaimers'.
- Do NOT provide or suggest antibiotics, steroids, benzodiazepines, opioids, or any Schedule H/X drugs.
- For children <12, pregnancy, chest pain, shortness of breath, severe bleeding, high fever > 39.4°C for >3 days,
  suicidal thoughts, stroke symptoms, severe dehydration, or head injury → triage_level must be "red" and include
  'red_flags' explaining why; recommend immediate medical care.
- If information is insufficient for dosing, DO NOT guess; ask for details and keep prescription empty.
- Only OTC items may appear in 'prescription.medicines', with 'otc': true. Otherwise keep it empty.
- Previous_reports / attachment context may contain prescription summaries or lab history. Reference them to compare
  improvements, unresolved issues, medication adherence, and highlight trends. If conflicts exist, flag them.
- Always return valid JSON that matches the requested schema exactly, no extra commentary.
"""

def _build_user_prompt(user_text: str, ctx: Optional[ChatPatientContext]) -> str:
    ctx_lines = []
    if ctx:
        if ctx.age_years is not None: ctx_lines.append(f"age_years: {ctx.age_years}")
        if ctx.sex: ctx_lines.append(f"sex: {ctx.sex}")
        if ctx.pregnant is not None: ctx_lines.append(f"pregnant: {ctx.pregnant}")
        if ctx.allergies: ctx_lines.append(f"allergies: {', '.join(ctx.allergies)}")
        if ctx.current_meds: ctx_lines.append(f"current_meds: {', '.join(ctx.current_meds)}")
        if ctx.chronic_conditions: ctx_lines.append(f"chronic_conditions: {', '.join(ctx.chronic_conditions)}")
        if ctx.country: ctx_lines.append(f"country: {ctx.country}")
        if ctx.previous_reports:
            snippets = []
            for idx, snippet in enumerate(ctx.previous_reports[:5]):
                clean = (snippet or "").strip()
                if not clean:
                    continue
                if len(clean) > 380:
                    clean = clean[:380] + "..."
                snippets.append(f"report_{idx + 1}: {clean}")
            if snippets:
                ctx_lines.append("previous_reports:\n" + "\n".join(f"  - {line}" for line in snippets))
    ctx_block = "\n".join(ctx_lines) if ctx_lines else "none"
    return (
        f"PATIENT CONTEXT:\n{ctx_block}\n\n"
        "USER MESSAGE:\n"
        f"{user_text}\n\n"
        "Return ONLY JSON with this EXACT shape:\n"
        "{\n"
        '  "reply_markdown": string,\n'
        '  "triage_level": "red" | "yellow" | "green",\n'
        '  "red_flags": string[],\n'
        '  "education_points": string[],\n'
        '  "prescription": {\n'
        '     "medicines": [\n'
        '        { "name": string, "dosage": string?, "frequency": string?, "duration": string?, "notes": string?, "otc": true }\n'
        "     ]?,\n"
        '     "advice": string[],\n'
        '     "follow_up": string?\n'
        "  }?,\n"
        '  "disclaimers": string[]\n'
        "}\n"
        "If unsure, ask 2-3 clarifying questions inside reply_markdown and keep prescription empty."
    )

def _summarize_patient_report(report: Dict, title: Optional[str] = None) -> str:
    if not isinstance(report, dict):
        return "Attachment provided but could not be summarised."

    summary_header = (report.get("summary_header") or title or "Prescription summary").strip()
    sections = report.get("report_sections") or []
    lines: List[str] = [summary_header]

    for section in sections[:3]:
        if not isinstance(section, dict):
            continue
        sec_title = section.get("title") or section.get("name") or "Section"
        items = section.get("items") or []
        if isinstance(items, list):
            cleaned_items = [str(item).strip() for item in items if isinstance(item, str)][:2]
            if cleaned_items:
                lines.append(f"{sec_title}: {', '.join(cleaned_items)}")

    raw = report.get("raw_extracted_data") or {}
    meds = raw.get("medications") if isinstance(raw, dict) else None
    if isinstance(meds, list) and meds:
        med_names = []
        for med in meds[:3]:
            if isinstance(med, dict):
                name = med.get("name") or med.get("drug_name")
                if name:
                    med_names.append(str(name).strip())
        if med_names:
            lines.append(f"Medications noted: {', '.join(med_names)}")

    summary = ". ".join(line for line in lines if line).strip()
    if len(summary) > 600:
        summary = summary[:600] + "..."
    return summary or "Attachment provided."

def _sanitize_base64(content: str) -> str:
    if not content:
        return ""
    return content.split(",")[-1].strip()

def chat_respond(payload: ChatMessageIn) -> Tuple[Dict, str]:
    """
    Calls Gemini with guardrails, validates JSON into ChatAIResponse,
    returns a serializable dict ready for the frontend.
    """
    attachment_notes: List[str] = []
    if payload.attachments:
        for attachment in payload.attachments[:5]:
            if not isinstance(attachment, ChatAttachment):
                continue
            title = attachment.title or attachment.kind.replace("_", " ").title()
            try:
                if attachment.kind == "image_base64":
                    b64 = _sanitize_base64(attachment.content)
                    if not b64:
                        attachment_notes.append(f"[Attachment: {title}] Image was empty or unreadable.")
                        continue
                    report, status = analyze_prescription_image(b64)
                    if isinstance(report, dict) and "error" not in report:
                        summary = _summarize_patient_report(report, title)
                        attachment_notes.append(f"[Attachment: {title}] {summary}")
                    else:
                        reason = report.get("error") if isinstance(report, dict) else "analysis failed"
                        attachment_notes.append(f"[Attachment: {title}] Unable to analyse image ({reason}).")
                elif attachment.kind in {"report_summary", "note"}:
                    snippet = (attachment.content or "").strip()
                    if not snippet:
                        continue
                    if len(snippet) > 600:
                        snippet = snippet[:600] + "..."
                    prefix = "Report summary" if attachment.kind == "report_summary" else "Note"
                    attachment_notes.append(f"[{prefix}: {title}] {snippet}")
            except Exception as exc:  # defensive, never break chat on attachment issues
                attachment_notes.append(f"[Attachment: {title}] Processing error: {exc}")

    # Build contents: system -> prior turns -> user
    parts: List[types.Part] = [types.Part(text=SYSTEM_GUARDRAILS)]
    # include brief history if provided
    if payload.history:
        for turn in payload.history[-6:]:
            role = "user" if turn.get("role") == "user" else "model"
            parts.append(types.Part(text=f"{role.upper()}:\n{turn.get('content','')}"))
    if attachment_notes:
        attachment_text = "ATTACHMENT CONTEXT:\n" + "\n".join(attachment_notes)
        parts.append(types.Part(text=attachment_text))
    # current user message
    user_prompt = _build_user_prompt(payload.user_message, payload.patient_context)
    contents = [types.Content(role="user", parts=parts + [types.Part(text=user_prompt)])]

    raw = _backoff_generate(contents, response_mime_type="application/json")
    json_text = _only_json(raw)

    try:
        ai = ChatAIResponse.model_validate_json(json_text)
    except ValidationError as ve:
        # minimal coercion: sometimes the model sends dicts for strings
        try:
            loose = json.loads(json_text)
            # fix trivial mistakes
            if isinstance(loose.get("reply_markdown"), dict):
                loose["reply_markdown"] = " ".join(
                    str(v) for v in loose["reply_markdown"].values() if isinstance(v, str)
                )[:1000]
            ai = ChatAIResponse.model_validate(loose)
        except Exception:
            return {"error": f"Chat validation failed: {ve}", "provider_raw": json_text[:1200]}, "Validation Error"

    session_id = payload.session_id or hashlib.sha256((payload.user_message + json_text).encode()).hexdigest()[:16]
    return ChatMessageOut(session_id=session_id, ai=ai).model_dump(), "OK"
