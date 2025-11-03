# app/chat_schemas.py
from typing import List, Optional, Literal, Dict
from pydantic import BaseModel, Field, AliasChoices, field_validator

RiskColor = Literal["red", "yellow", "green"]

class ChatPatientContext(BaseModel):
    age_years: Optional[int] = None
    sex: Optional[str] = None          # "male" | "female" | "other" | None
    pregnant: Optional[bool] = None
    allergies: Optional[List[str]] = None
    current_meds: Optional[List[str]] = None
    chronic_conditions: Optional[List[str]] = None
    country: Optional[str] = None      # e.g., "IN" for India
    previous_reports: Optional[List[str]] = None  # short text snippets summarising past visits

class ChatAttachment(BaseModel):
    kind: Literal["image_base64", "report_summary", "note"]
    content: str
    title: Optional[str] = None

class ChatMessageIn(BaseModel):
    session_id: Optional[str] = None
    user_message: str = Field(min_length=1)
    patient_context: Optional[ChatPatientContext] = None
    history: Optional[List[Dict[str, str]]] = None
    attachments: Optional[List[ChatAttachment]] = None
    # history format (optional): [{ "role": "user"|"ai", "content": "..." }, ...]

# ---------- AI JSON response shapes ----------

class ChatMedication(BaseModel):
    model_config = {"extra": "ignore"}
    # Accept common aliases
    name: str = Field(validation_alias=AliasChoices("name", "drug_name", "medicine", "brand"))
    dosage: Optional[str] = Field(default=None, validation_alias=AliasChoices("dosage", "dose", "strength"))
    frequency: Optional[str] = Field(default=None, validation_alias=AliasChoices("frequency", "freq", "schedule"))
    duration: Optional[str] = Field(default=None, validation_alias=AliasChoices("duration", "days", "course"))
    notes: Optional[str] = Field(default=None, validation_alias=AliasChoices("notes", "instruction", "instructions"))
    otc: Optional[bool] = False  # must be True if present at all

class ChatPrescriptionAI(BaseModel):
    medicines: List[ChatMedication] = Field(default_factory=list)
    advice: List[str] = Field(default_factory=list)
    follow_up: Optional[str] = None

class ChatAIResponse(BaseModel):
    # This is what we ask Gemini to output
    reply_markdown: str
    triage_level: RiskColor
    red_flags: List[str] = Field(default_factory=list)
    education_points: List[str] = Field(default_factory=list)
    prescription: Optional[ChatPrescriptionAI] = None
    disclaimers: List[str] = Field(default_factory=list)

    @field_validator("reply_markdown", mode="before")
    @classmethod
    def _mk_reply(cls, v):
        if isinstance(v, dict):
            return " ".join(str(x) for x in v.values() if isinstance(x, str))[:1000] or "I’m here to help."
        return str(v)

class ChatMessageOut(BaseModel):
    session_id: str
    ai: ChatAIResponse
