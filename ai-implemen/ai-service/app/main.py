# # app/main.py
# import os
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from dotenv import load_dotenv

# load_dotenv()

# # --- Prescription analyzer contracts ---
# from app.schemas import ImageAnalysisRequest, AnalysisResponse, StructuredPrescriptionRequest
# from app.gemini_client import analyze_prescription_image, analyze_prescription_structured

# # --- Chatbot contracts ---
# from app.chat_schemas import ChatMessageIn
# from app.gemini_chat import chat_respond

# # -----------------------------------------------------------------------------
# # FastAPI app
# # -----------------------------------------------------------------------------
# app = FastAPI(
#     title="Medical AI Service",
#     description="Prescription OCR + Patient-friendly report + AI Chat (OTC & triage).",
#     version="1.0.0",
# )

# # CORS for local dev (Next.js)
# ALLOWED_ORIGINS = [
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
#     "http://127.0.0.1:3001",
#     "http://localhost",
#     "http://127.0.0.1",
# ]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # -----------------------------------------------------------------------------
# # Health
# # -----------------------------------------------------------------------------
# @app.get("/")
# def root():
#     return {"status": "ok", "service": "Medical AI Service"}

# @app.get("/healthz")
# def healthz():
#     return {"status": "ok", "service": "FastAPI AI Service"}

# # -----------------------------------------------------------------------------
# # Prescription Analyzer
# # -----------------------------------------------------------------------------
# @app.post("/analyze", response_model=AnalysisResponse)
# async def analyze_image(request: ImageAnalysisRequest):
#     """
#     Receives a Base64 image, runs:
#       1) Vision extraction -> PrescriptionData
#       2) Text synthesis    -> PatientReport
#     Returns a validated PatientReport (with raw_extracted_data injected).
#     """
#     if not os.getenv("GEMINI_API_KEY"):
#         return AnalysisResponse(
#             status="error",
#             message="GEMINI_API_KEY is not set in ai-service/.env",
#             report=None,
#         )

#     report_data, status_message = analyze_prescription_image(request.base64_image)

#     if "error" in report_data:
#         # Surface provider / validation issues with 422 to the frontend
#         raise HTTPException(
#             status_code=422,
#             detail={"msg": "AI Analysis Failed", "error": report_data["error"]},
#         )

#     return AnalysisResponse(
#         status="success",
#         message="Analysis complete and patient report generated.",
#         report=report_data,
#     )

# @app.post("/analyze-structured", response_model=AnalysisResponse)
# async def analyze_structured(request: StructuredPrescriptionRequest):
#     """
#     Receives structured prescription data, runs synthesis to create a patient report.
#     """
#     if not os.getenv("GEMINI_API_KEY"):
#         return AnalysisResponse(
#             status="error",
#             message="GEMINI_API_KEY is not set in ai-service/.env",
#             report=None,
#         )

#     report_data, status_message = analyze_prescription_structured(request)

#     if "error" in report_data:
#         raise HTTPException(
#             status_code=422,
#             detail={"msg": "AI Analysis Failed", "error": report_data["error"]},
#         )

#     return AnalysisResponse(
#         status="success",
#         message="Structured analysis complete and patient report generated.",
#         report=report_data,
#     )

# # -----------------------------------------------------------------------------
# # Chatbot
# # -----------------------------------------------------------------------------
# @app.post("/chat/send")
# async def chat_send(msg: ChatMessageIn):
#     """
#     Stateless chat turn. Pass session_id to keep a thread on the frontend.
#     Body: ChatMessageIn
#     Returns: { status, message, data: { session_id, ai: ChatAIResponse } }
#     """
#     if not os.getenv("GEMINI_API_KEY"):
#         raise HTTPException(
#             status_code=500,
#             detail={"msg": "Chat Failed", "error": "GEMINI_API_KEY is not set"},
#         )

#     data, status = chat_respond(msg)

#     if "error" in data:
#         # Validation or provider formatting issue
#         raise HTTPException(
#             status_code=422,
#             detail={"msg": "Chat Failed", "error": data["error"]},
#         )

#     return {"status": "success", "message": "ok", "data": data}





# import os
# from fastapi import FastAPI, HTTPException
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import ValidationError

# from app.schemas import ImageAnalysisRequest, AnalysisResponse, PatientReport
# from app.gemini_client import analyze_prescription_image


# from app.chat_schemas import ChatMessageIn
# from app.gemini_chat import chat_respond



# app = FastAPI(
#     title="Prescription OCR & AI Analyzer",
#     description="OCR + extraction (Gemini) → patient-friendly R/Y/G report.",
#     version="0.1.0",
# )

# # CORS for local Next.js
# origins = [
#     "http://localhost",
#     "http://127.0.0.1",
#     "http://localhost:3000",
#     "http://127.0.0.1:3000",
#     "http://localhost:3001",
# ]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# @app.get("/healthz")
# async def health_check():
#     return {"status": "ok", "service": "FastAPI AI Service"}

# @app.post("/analyze", response_model=AnalysisResponse)
# async def analyze_image(request: ImageAnalysisRequest):
#     """
#     Receives a Base64 image, runs:
#       1) Vision extraction → PrescriptionData
#       2) Text synthesis   → PatientReportAI
#       3) Promotion        → PatientReport (inject raw_extracted_data)
#     Returns a friendly AnalysisResponse; maps schema/provider errors to 422.
#     """
#     if not os.getenv("GEMINI_API_KEY"):
#         return AnalysisResponse(
#             status="error",
#             message="GEMINI_API_KEY is not set in ai-service/.env",
#             report=None,
#         )

#     try:
#         data, status_msg = analyze_prescription_image(request.base64_image)

#         # gemini_client returns {"error": "..."} on any failure it can detect
#         if isinstance(data, dict) and "error" in data:
#             # Optionally include provider_raw for debugging:
#             # provider_raw = data.get("provider_raw")
#             raise HTTPException(
#                 status_code=422,
#                 detail={
#                     "msg": "AI Analysis Failed",
#                     "error": data.get("error"),
#                     # "provider_raw": provider_raw[:1000] if provider_raw else None,
#                 },
#             )

#         # At this point 'data' should be a dict matching PatientReport
#         try:
#             # Validate once more before returning (defensive)
#             _ = PatientReport(**data)
#         except ValidationError as ve:
#             raise HTTPException(
#                 status_code=422,
#                 detail={"msg": "Final report validation failed", "errors": ve.errors()},
#             )

#         return AnalysisResponse(
#             status="success",
#             message="Analysis complete and patient report generated.",
#             report=data,  # already a PatientReport-shaped dict
#         )

#     except HTTPException:
#         raise
#     except ValidationError as ve:
#         # Any stray model errors become 422
#         raise HTTPException(
#             status_code=422, detail={"msg": "Validation error", "error  s": ve.errors()}
#         )
#     except Exception as e:
#         # Unknown server error
#         raise HTTPException(status_code=500, detail={"msg": "Internal error", "error": str(e)})

# app/main.py
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# --- Prescription analyzer contracts ---
from app.schemas import ImageAnalysisRequest, AnalysisResponse, StructuredPrescriptionRequest
from app.gemini_client import analyze_prescription_image, analyze_prescription_structured

# --- Chatbot contracts ---
from app.chat_schemas import ChatMessageIn
from app.gemini_chat import chat_respond

# -----------------------------------------------------------------------------
# FastAPI app
# -----------------------------------------------------------------------------
app = FastAPI(
    title="Medical AI Service",
    description="Prescription OCR + Patient-friendly report + AI Chat (OTC & triage).",
    version="1.0.0",
)

# CORS for local dev (Next.js)
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://localhost",
    "http://127.0.0.1",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------------------------------------------------------
# Health
# -----------------------------------------------------------------------------
@app.get("/")
def root():
    return {"status": "ok", "service": "Medical AI Service"}

@app.get("/healthz")
def healthz():
    return {"status": "ok", "service": "FastAPI AI Service"}

# -----------------------------------------------------------------------------
# Prescription Analyzer
# -----------------------------------------------------------------------------
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(request: ImageAnalysisRequest):
    """
    Receives a Base64 image, runs:
      1) Vision extraction -> PrescriptionData
      2) Text synthesis    -> PatientReport
    Returns a validated PatientReport (with raw_extracted_data injected).
    """
    if not os.getenv("GEMINI_API_KEY"):
        return AnalysisResponse(
            status="error",
            message="GEMINI_API_KEY is not set in ai-service/.env",
            report=None,
        )

    report_data, status_message = analyze_prescription_image(request.base64_image)

    if "error" in report_data:
        # Surface provider / validation issues with 422 to the frontend
        raise HTTPException(
            status_code=422,
            detail={"msg": "AI Analysis Failed", "error": report_data["error"]},
        )

    return AnalysisResponse(
        status="success",
        message="Analysis complete and patient report generated.",
        report=report_data,
    )


@app.post("/analyze-structured", response_model=AnalysisResponse)
async def analyze_structured(request: StructuredPrescriptionRequest):
    if not os.getenv("GEMINI_API_KEY"):
        return AnalysisResponse(
            status="error",
            message="GEMINI_API_KEY is not set in ai-service/.env",
            report=None,
        )

    report_data, status_message = analyze_prescription_structured(request)

    if isinstance(report_data, dict) and "error" in report_data:
        raise HTTPException(
            status_code=422,
            detail={"msg": "AI Analysis Failed", "error": report_data.get("error")},
        )

    return AnalysisResponse(
        status="success",
        message="Structured analysis complete and patient report generated.",
        report=report_data,
    )

# -----------------------------------------------------------------------------
# Chatbot
# -----------------------------------------------------------------------------
@app.post("/chat/send")
async def chat_send(msg: ChatMessageIn):
    """
    Stateless chat turn. Pass session_id to keep a thread on the frontend.
    Body: ChatMessageIn
    Returns: { status, message, data: { session_id, ai: ChatAIResponse } }
    """
    if not os.getenv("GEMINI_API_KEY"):
        raise HTTPException(
            status_code=500,
            detail={"msg": "Chat Failed", "error": "GEMINI_API_KEY is not set"},
        )

    data, status = chat_respond(msg)

    if "error" in data:
        # Validation or provider formatting issue
        raise HTTPException(
            status_code=422,
            detail={"msg": "Chat Failed", "error": data["error"]},
        )

    return {"status": "success", "message": "ok", "data": data}
