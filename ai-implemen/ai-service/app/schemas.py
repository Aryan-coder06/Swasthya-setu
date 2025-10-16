
# from typing import List, Dict, Optional, Any, Literal
# from pydantic import BaseModel, Field, AliasChoices

# # ---------------------------------------------------------
# # 1) Extraction schema: tolerant to common key synonyms
# # ---------------------------------------------------------

# class Medication(BaseModel):
#     """
#     One medication line parsed from the prescription.
#     Accepts common synonyms from OCR/LLM via validation_alias.
#     """
#     model_config = {"extra": "ignore"}  # ignore unexpected keys safely

#     # Accept "name", "drug_name", "medicine_name", "med_name", "brand_name"
#     name: str = Field(
#         validation_alias=AliasChoices("name", "drug_name", "medicine_name", "med_name", "brand_name")
#     )

#     # Accept "dosage", "dose", "strength", "dose_strength"
#     dosage: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("dosage", "dose", "strength", "dose_strength")
#     )

#     # Accept "frequency", "freq", "times_per_day", "schedule", "sig"
#     frequency: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("frequency", "freq", "times_per_day", "schedule", "sig")
#     )

#     # Accept "duration", "days", "course", "for", "no_of_days"
#     duration: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("duration", "days", "course", "for", "no_of_days")
#     )

#     # Accept "notes", "instructions", "direction", "directions", "admin", "route"
#     # (you can add a dedicated 'route' field later if needed)
#     notes: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("notes", "instructions", "direction", "directions", "admin", "route")
#     )

# class PrescriptionData(BaseModel):
#     """
#     Structured data extracted from the image by Gemini.
#     The model is forgiving about alternate field names at the top level too.
#     """
#     model_config = {"extra": "ignore"}

#     hospital_name: Optional[str] = Field(default=None)
#     doctor_name: Optional[str] = Field(default=None)
#     patient_name: Optional[str] = Field(default=None)
#     patient_id: Optional[str] = Field(default=None)
#     date_issued: Optional[str] = Field(default=None)  # normalize later if needed

#     # Accept "vitals" or "vital_signs"
#     vitals: Optional[Dict[str, str]] = Field(
#         default=None,
#         validation_alias=AliasChoices("vitals", "vital_signs")
#     )

#     # Accept "diseases_diagnoses", "diagnosis", "diagnoses", "diseases"
#     diseases_diagnoses: List[str] = Field(
#         default_factory=list,
#         validation_alias=AliasChoices("diseases_diagnoses", "diagnosis", "diagnoses", "diseases")
#     )

#     # Accept "medications", "meds", "medicine_list", "prescribed_medicines"
#     medications: List[Medication] = Field(
#         default_factory=list,
#         validation_alias=AliasChoices("medications", "meds", "medicine_list", "prescribed_medicines")
#     )

#     # Accept "treatment_notes", "plan", "treatment_plan"
#     treatment_notes: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("treatment_notes", "plan", "treatment_plan")
#     )

#     # Accept "precautions", "warnings", "cautions"
#     precautions: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("precautions", "warnings", "cautions")
#     )

#     # Debug/trace
#     raw_lines: List[str] = Field(default_factory=list)

# # ---------------------------------------------------------
# # 2) Synthesis schemas (unchanged)
# # ---------------------------------------------------------

# RiskColor = Literal["green", "yellow", "red"]

# class ReportSection(BaseModel):
#     title: str
#     color: RiskColor
#     items: List[str] = Field(default_factory=list)

# class PatientReportAI(BaseModel):
#     """
#     Shape required from the LLM (no raw_extracted_data here).
#     """
#     model_config = {"extra": "ignore"}

#     summary_header: str = Field(min_length=1)
#     report_sections: List[ReportSection] = Field(min_items=1)

#     # Optional mirrors (nice to have if the LLM copies them)
#     patient_name: Optional[str] = None
#     doctor_name: Optional[str] = None
#     date_issued: Optional[str] = None

# class PatientReport(PatientReportAI):
#     """
#     Final API object: AI output + raw extraction (injected server-side).
#     """
#     raw_extracted_data: PrescriptionData

# # ---------------------------------------------------------
# # 3) FastAPI input / output models (unchanged)
# # ---------------------------------------------------------

# class ImageAnalysisRequest(BaseModel):
#     base64_image: str = Field(description="Base64-encoded JPG/PNG of the prescription.")

# class AnalysisResponse(BaseModel):
#     status: Literal["success", "error"]
#     message: str
#     report: Optional[PatientReport] = None












#### BEGGGINNNING WORKING CODDEEE ####




# from typing import List, Dict, Optional, Any, Literal
# from pydantic import BaseModel, Field, AliasChoices

# # ---------------------------------------------------------
# # 1) Extraction schema: tolerant to common key synonyms
# # ---------------------------------------------------------

# class Medication(BaseModel):
#     """
#     One medication line parsed from the prescription.
#     Accepts common synonyms from OCR/LLM via validation_alias.
#     """
#     model_config = {"extra": "ignore"}  # ignore unexpected keys safely

#     # Accept "name", "drug_name", "medicine_name", "med_name", "brand_name"
#     name: str = Field(
#         validation_alias=AliasChoices("name", "drug_name", "medicine_name", "med_name", "brand_name")
#     )

#     # Accept "dosage", "dose", "strength", "dose_strength"
#     dosage: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("dosage", "dose", "strength", "dose_strength")
#     )

#     # Accept "frequency", "freq", "times_per_day", "schedule", "sig"
#     frequency: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("frequency", "freq", "times_per_day", "schedule", "sig")
#     )

#     # Accept "duration", "days", "course", "for", "no_of_days"
#     duration: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("duration", "days", "course", "for", "no_of_days")
#     )

#     # Accept "notes", "instructions", "direction", "directions", "admin", "route"
#     # (you can add a dedicated 'route' field later if needed)
#     notes: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("notes", "instructions", "direction", "directions", "admin", "route")
#     )

# class PrescriptionData(BaseModel):
#     """
#     Structured data extracted from the image by Gemini.
#     The model is forgiving about alternate field names at the top level too.
#     """
#     model_config = {"extra": "ignore"}

#     hospital_name: Optional[str] = Field(default=None)
#     doctor_name: Optional[str] = Field(default=None)
#     patient_name: Optional[str] = Field(default=None)
#     patient_id: Optional[str] = Field(default=None)
#     date_issued: Optional[str] = Field(default=None)  # normalize later if needed

#     # Accept "vitals" or "vital_signs"
#     vitals: Optional[Dict[str, str]] = Field(
#         default=None,
#         validation_alias=AliasChoices("vitals", "vital_signs")
#     )

#     # Accept "diseases_diagnoses", "diagnosis", "diagnoses", "diseases"
#     diseases_diagnoses: List[str] = Field(
#         default_factory=list,
#         validation_alias=AliasChoices("diseases_diagnoses", "diagnosis", "diagnoses", "diseases")
#     )

#     # Accept "medications", "meds", "medicine_list", "prescribed_medicines"
#     medications: List[Medication] = Field(
#         default_factory=list,
#         validation_alias=AliasChoices("medications", "meds", "medicine_list", "prescribed_medicines")
#     )

#     # Accept "treatment_notes", "plan", "treatment_plan"
#     treatment_notes: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("treatment_notes", "plan", "treatment_plan")
#     )

#     # Accept "precautions", "warnings", "cautions"
#     precautions: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("precautions", "warnings", "cautions")
#     )

#     # Debug/trace
#     raw_lines: List[str] = Field(default_factory=list)

# # ---------------------------------------------------------
# # 2) Synthesis schemas (unchanged)
# # ---------------------------------------------------------

# RiskColor = Literal["green", "yellow", "red"]

# class ReportSection(BaseModel):
#     title: str
#     color: RiskColor
#     items: List[str] = Field(default_factory=list)

# class PatientReportAI(BaseModel):
#     """
#     Shape required from the LLM (no raw_extracted_data here).
#     """
#     model_config = {"extra": "ignore"}

#     summary_header: str = Field(min_length=1)
#     report_sections: List[ReportSection] = Field(min_items=1)

#     # Optional mirrors (nice to have if the LLM copies them)
#     patient_name: Optional[str] = None
#     doctor_name: Optional[str] = None
#     date_issued: Optional[str] = None

# class PatientReport(PatientReportAI):
#     """
#     Final API object: AI output + raw extraction (injected server-side).
#     """
#     raw_extracted_data: PrescriptionData

# # ---------------------------------------------------------
# # 3) FastAPI input / output models (unchanged)
# # ---------------------------------------------------------

# class ImageAnalysisRequest(BaseModel):
#     base64_image: str = Field(description="Base64-encoded JPG/PNG of the prescription.")

# class AnalysisResponse(BaseModel):
#     status: Literal["success", "error"]
#     message: str
#     report: Optional[PatientReport] = None































# #### UPDATE 1 


# from typing import List, Dict, Optional, Any, Literal
# from pydantic import BaseModel, Field, AliasChoices, field_validator

# # ---------------------------------------------------------
# # 1) Extraction schema: tolerant + normalizing
# # ---------------------------------------------------------

# class Medication(BaseModel):
#     """One medication line parsed from the prescription."""
#     model_config = {"extra": "ignore"}

#     # Accept "name", "drug_name", "medicine_name", "med_name", "brand_name"
#     name: str = Field(
#         validation_alias=AliasChoices("name", "drug_name", "medicine_name", "med_name", "brand_name")
#     )
#     # Accept "dosage", "dose", "strength", "dose_strength"
#     dosage: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("dosage", "dose", "strength", "dose_strength")
#     )
#     # Accept "frequency", "freq", "times_per_day", "schedule", "sig"
#     frequency: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("frequency", "freq", "times_per_day", "schedule", "sig")
#     )
#     # Accept "duration", "days", "course", "for", "no_of_days"
#     duration: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("duration", "days", "course", "for", "no_of_days")
#     )
#     # Accept "notes", "instructions", "direction", "directions", "admin", "route"
#     notes: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("notes", "instructions", "direction", "directions", "admin", "route")
#     )

# class PrescriptionData(BaseModel):
#     """Structured data extracted from the image by Gemini."""
#     model_config = {"extra": "ignore"}

#     hospital_name: Optional[str] = Field(default=None)
#     doctor_name: Optional[str] = Field(default=None)
#     patient_name: Optional[str] = Field(default=None)
#     patient_id: Optional[str] = Field(default=None)
#     date_issued: Optional[str] = Field(default=None)  # normalize later if needed

#     # Accept "vitals" or "vital_signs"
#     vitals: Optional[Dict[str, str]] = Field(
#         default=None,
#         validation_alias=AliasChoices("vitals", "vital_signs")
#     )

#     # Accept "diseases_diagnoses", "diagnosis", "diagnoses", "diseases"
#     diseases_diagnoses: List[str] = Field(
#         default_factory=list,
#         validation_alias=AliasChoices("diseases_diagnoses", "diagnosis", "diagnoses", "diseases")
#     )

#     # Accept "medications", "meds", "medicine_list", "prescribed_medicines"
#     medications: List[Medication] = Field(
#         default_factory=list,
#         validation_alias=AliasChoices("medications", "meds", "medicine_list", "prescribed_medicines")
#     )

#     # Accept "treatment_notes", "plan", "treatment_plan", "notes", "recommendations", "advice", "instructions"
#     treatment_notes: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices(
#             "treatment_notes", "plan", "treatment_plan",
#             "notes", "recommendations", "advice", "instructions", "clinical_notes", "history"
#         )
#     )

#     # Accept "precautions", "warnings", "cautions", "red_flags", "emergency_advice"
#     precautions: Optional[str] = Field(
#         default=None,
#         validation_alias=AliasChoices("precautions", "warnings", "cautions", "red_flags", "emergency_advice")
#     )

#     # Optional debug/trace
#     raw_lines: List[str] = Field(default_factory=list)

#     # ---- Normalizers: coerce list/dict -> joined string ----
#     @field_validator("treatment_notes", "precautions", mode="before")
#     @classmethod
#     def _coerce_to_string(cls, v):
#         if v is None:
#             return None
#         # list of strings -> "• a; • b; ..."
#         if isinstance(v, list):
#             return "; ".join([str(x) for x in v if isinstance(x, (str, int, float))]).strip() or None
#         # dict -> join stringy values
#         if isinstance(v, dict):
#             return "; ".join([str(x) for x in v.values() if isinstance(x, (str, int, float))]).strip() or None
#         # anything else -> stringify
#         return str(v).strip() or None

# # ---------------------------------------------------------
# # 2) Synthesis schemas (unchanged, strict)
# # ---------------------------------------------------------

# RiskColor = Literal["green", "yellow", "red"]

# class ReportSection(BaseModel):
#     title: str
#     color: RiskColor
#     items: List[str] = Field(default_factory=list)

# class PatientReportAI(BaseModel):
#     model_config = {"extra": "ignore"}
#     summary_header: str = Field(min_length=1)
#     report_sections: List[ReportSection] = Field(min_items=1)

#     # Optional mirrors (nice to have if the LLM copies them)
#     patient_name: Optional[str] = None
#     doctor_name: Optional[str] = None
#     date_issued: Optional[str] = None

# class PatientReport(PatientReportAI):
#     raw_extracted_data: PrescriptionData

# # ---------------------------------------------------------
# # 3) FastAPI input / output models (unchanged)
# # ---------------------------------------------------------

# class ImageAnalysisRequest(BaseModel):
#     base64_image: str = Field(description="Base64-encoded JPG/PNG of the prescription.")

# class AnalysisResponse(BaseModel):
#     status: Literal["success", "error"]
#     message: str
#     report: Optional[PatientReport] = None





















from typing import List, Dict, Optional, Any, Literal
from pydantic import BaseModel, Field, AliasChoices, field_validator

# ---------------------------------------------------------
# 1) Extraction schema: tolerant + normalizing
# ---------------------------------------------------------

class Medication(BaseModel):
    """One medication line parsed from the prescription."""
    model_config = {"extra": "ignore"}

    # Accept "name", "drug_name", "medicine_name", "med_name", "brand_name"
    name: str = Field(
        validation_alias=AliasChoices("name", "drug_name", "medicine_name", "med_name", "brand_name")
    )
    # Accept "dosage", "dose", "strength", "dose_strength"
    dosage: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("dosage", "dose", "strength", "dose_strength")
    )
    # Accept "frequency", "freq", "times_per_day", "schedule", "sig"
    frequency: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("frequency", "freq", "times_per_day", "schedule", "sig")
    )
    # Accept "duration", "days", "course", "for", "no_of_days"
    duration: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("duration", "days", "course", "for", "no_of_days")
    )
    # Accept "notes", "instructions", "direction", "directions", "admin", "route"
    notes: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("notes", "instructions", "direction", "directions", "admin", "route")
    )

class PrescriptionData(BaseModel):
    """Structured data extracted from the image by Gemini."""
    model_config = {"extra": "ignore"}

    hospital_name: Optional[str] = Field(default=None)
    doctor_name: Optional[str] = Field(default=None)
    patient_name: Optional[str] = Field(default=None)
    patient_id: Optional[str] = Field(default=None)
    date_issued: Optional[str] = Field(default=None)  # normalize later if needed

    # Accept "vitals" or "vital_signs"
    vitals: Optional[Dict[str, str]] = Field(
        default=None,
        validation_alias=AliasChoices("vitals", "vital_signs")
    )

    # Accept "diseases_diagnoses", "diagnosis", "diagnoses", "diseases"
    diseases_diagnoses: List[str] = Field(
        default_factory=list,
        validation_alias=AliasChoices("diseases_diagnoses", "diagnosis", "diagnoses", "diseases")
    )

    # Accept "medications", "meds", "medicine_list", "prescribed_medicines"
    medications: List[Medication] = Field(
        default_factory=list,
        validation_alias=AliasChoices("medications", "meds", "medicine_list", "prescribed_medicines")
    )

    # Accept "treatment_notes", "plan", "treatment_plan", "notes", "recommendations", "advice", "instructions"
    treatment_notes: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices(
            "treatment_notes", "plan", "treatment_plan",
            "notes", "recommendations", "advice", "instructions", "clinical_notes", "history"
        )
    )

    # Accept "precautions", "warnings", "cautions", "red_flags", "emergency_advice"
    precautions: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("precautions", "warnings", "cautions", "red_flags", "emergency_advice")
    )

    # Optional debug/trace
    raw_lines: List[str] = Field(default_factory=list)

    # ---- Normalizers ----

    @field_validator("vitals", mode="before")
    @classmethod
    def _normalize_vitals(cls, v):
        """
        Accepts:
          - dict with any value types (int/float/bool/list/str)
          - list of {name|key|label, value|val}
        Returns Dict[str, str] or None.
        """
        if v is None:
            return None

        def to_str(val) -> str:
            if isinstance(val, (int, float, bool)):
                return str(val)
            if isinstance(val, (list, tuple)):
                return ", ".join(str(x) for x in val if x is not None)
            return str(val) if val is not None else ""

        out: Dict[str, str] = {}

        if isinstance(v, dict):
            for k, val in v.items():
                key = str(k)
                sval = to_str(val).strip()
                if key and sval:
                    out[key] = sval
            return out or None

        if isinstance(v, list):
            for item in v:
                if isinstance(item, dict):
                    key = item.get("name") or item.get("key") or item.get("label")
                    val = item.get("value") or item.get("val")
                    if key is not None and val is not None:
                        out[str(key)] = to_str(val).strip()
            return out or None

        # fallback: try to stringify unknown shape
        return {"value": to_str(v).strip()} if str(v).strip() else None

    @field_validator("treatment_notes", "precautions", mode="before")
    @classmethod
    def _coerce_to_string(cls, v):
        if v is None:
            return None
        if isinstance(v, list):
            return "; ".join([str(x) for x in v if isinstance(x, (str, int, float))]).strip() or None
        if isinstance(v, dict):
            return "; ".join([str(x) for x in v.values() if isinstance(x, (str, int, float))]).strip() or None
        return str(v).strip() or None

# ---------------------------------------------------------
# 2) Synthesis schemas (unchanged)
# ---------------------------------------------------------

RiskColor = Literal["green", "yellow", "red"]

class ReportSection(BaseModel):
    title: str
    color: RiskColor
    items: List[str] = Field(default_factory=list)

class PatientReportAI(BaseModel):
    model_config = {"extra": "ignore"}
    summary_header: str = Field(min_length=1)
    report_sections: List[ReportSection] = Field(min_items=1)

    # Optional mirrors (LLM may include them)
    patient_name: Optional[str] = None
    doctor_name: Optional[str] = None
    date_issued: Optional[str] = None

class PatientReport(PatientReportAI):
    raw_extracted_data: PrescriptionData

# ---------------------------------------------------------
# 3) FastAPI input / output models (unchanged)
# ---------------------------------------------------------

class ImageAnalysisRequest(BaseModel):
    base64_image: str = Field(description="Base64-encoded JPG/PNG of the prescription.")

class AnalysisResponse(BaseModel):
    status: Literal["success", "error"]
    message: str
    report: Optional[PatientReport] = None
