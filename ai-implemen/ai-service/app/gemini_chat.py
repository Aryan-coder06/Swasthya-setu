# app/gemini_chat.py
import os, json, re, time, random, hashlib
from typing import List, Dict, Tuple, Optional

from dotenv import load_dotenv
from pydantic import ValidationError
from google import genai
from google.genai import types
from google.genai.errors import APIError as GeminiAPIError

from app.chat_schemas import ChatMessageIn, ChatMessageOut, ChatAIResponse, ChatPatientContext

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

def chat_respond(payload: ChatMessageIn) -> Tuple[Dict, str]:
    """
    Calls Gemini with guardrails, validates JSON into ChatAIResponse,
    returns a serializable dict ready for the frontend.
    """
    # Build contents: system -> prior turns -> user
    parts: List[types.Part] = [types.Part(text=SYSTEM_GUARDRAILS)]
    # include brief history if provided
    if payload.history:
        for turn in payload.history[-6:]:
            role = "user" if turn.get("role") == "user" else "model"
            parts.append(types.Part(text=f"{role.upper()}:\n{turn.get('content','')}"))
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
