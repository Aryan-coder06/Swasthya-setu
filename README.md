# 🧭 Swasthya Setu — India’s Integrated Hospital‑Patient Bridge

> **Unified digital rails for patients, clinicians, and hospital desks**—built for India’s urban density and rural reach.

![Status](https://img.shields.io/badge/status-active-success) ![Stack](https://img.shields.io/badge/stack-Next.js%20%7C%20Express%20%7C%20FastAPI-blue) ![AI](https://img.shields.io/badge/AI-Gemini%20%2B%20OCR-purple)

## 🔗 Quick Links
- **Frontend**: `Frontend/`
- **Backend**: `backend/`
- **AI Service**: `ai-implemen/ai-service/`

## ⚡ Quickstart
```bash
# Frontend
cd Frontend
npm install
npm run dev         # http://localhost:3000

# Backend
cd backend
npm install
npm run dev         # http://localhost:5000

# AI Service
cd ai-implemen/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 🧠 Mission
- Build a single “Setu” that coordinates care across patients, clinicians, and front‑desk staff.
- Reduce queueing, lost paper prescriptions, and disconnected records.
- Deliver AI‑powered prescription literacy and triage without compromising safety.

## 🌍 The Problem We Target
- **Urban–rural gap:** Access deserts persist due to doctor concentration in cities.
- **Fragmented records:** Patients carry paper files that are easy to lose.
- **Manual front desks:** Walk‑ins, bed assignment, and billing don’t scale.
- **Prescription opacity:** Patients struggle to decode handwritten instructions.
- **AI adoption gap:** Digital health rails exist, but hospital‑side intelligence lags.

## 🧩 Solution Overview
Swasthya Setu is a tri‑portal platform backed by a unified API and an AI microservice:
- **Next.js 13 Frontend** for patients, doctors, and receptionists.
- **Express API** orchestrating Supabase auth, appointments, and operations.
- **FastAPI AI Service** for OCR + Gemini summarization and chat.
- **Supabase** for Postgres, Auth, and Storage.

## 🏗️ Architecture
```
┌────────────────────┐        ┌─────────────────────┐
│ Next.js Frontend   │        │  AI Service         │
│  • Patient app      │  REST │  (FastAPI + Gemini) │
│  • Doctor portal    │◀──────┤  • OCR + synthesis  │
│  • Receptionist ops │        │  • AI triage chat   │
└─────────▲──────────┘        └─────────▲───────────┘
          │ REST / Webhooks              │
          │                              │
┌─────────┴──────────┐        ┌──────────┴──────────┐
│ Express API         │  SQL  │ Supabase             │
│  (Node.js + Supabase│◀──────┤  • Auth & row-level  │
│          client)    │       │    security          │
│  • Auth routes      │       │  • Postgres tables   │
│  • Appointments     │       │  • Storage buckets   │
│  • Billing & beds   │       └──────────────────────┘
└────────────────────┘
```

## 🛠️ Tech Stack
| Layer | Stack | Why it fits |
| --- | --- | --- |
| Frontend | Next.js 13 (App Router), TypeScript, Tailwind | Fast UX, strong typing, reusable UI |
| Backend | Node.js (ESM), Express, Supabase JS, Multer | Rapid API development + storage |
| AI Service | FastAPI, Gemini SDK, Pydantic, Pillow | Async inference + schema validation |
| Data | Supabase Postgres + Storage | Managed infra with RLS |

## ✨ Feature Deep Dive

### 👤 Patient Experience
- **Unified onboarding** with hospital selection.
- **Smart appointment booking** (15‑minute slots, conflict checks).
- **Prescription literacy** via OCR + AI report synthesis.
- **AI triage & OTC guidance** with strict guardrails.
- **Hospital discovery** with geo filters + offline fallback.

### 🩺 Doctor Experience
- **Dashboard snapshot** with auto‑completion of expired appointments.
- **Analytics** for 30‑day volume and unique patients.
- **Appointment cockpit** + Jitsi links for video visits.
- **Prescription workflows** with AI‑assisted analysis.

### 🧾 Receptionist & Hospital Ops
- **Operational KPIs** (walk‑ins, beds, billing, revenue).
- **Walk‑in ticketing** with sequential tokens.
- **Bed & admission control** with occupancy tracking.
- **Billing** with invoice numbering and payment status.

## 🧬 AI & Data Intelligence
- **Prescription OCR Pipeline**: image → OCR → structured JSON → patient‑friendly report.
- **Guardrails**: triage levels, OTC‑only suggestions, emergency escalation.
- **Caching**: reduces duplicate AI calls for the same input.

## 🗃️ Supabase Data Model (Key Tables)
- `Patient_Profile`, `Doctor_Profile`, `receptionist_profile`
- `appointments`, `walkin_tickets`, `admissions`, `bed_management`
- `invoices`, `appointment_requests`, `notifications`
- `prescriptions`, `Prescription_Reports`
- `hospitals`

## 🔌 Key API Surface
| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/signup/{role}` | Role‑based registration |
| `POST` | `/auth/signin/{role}` | Role‑based login |
| `GET` | `/auth/hospitals` | Hospital directory |
| `POST` | `/patient/appointments/book` | Patient booking |
| `POST` | `/patient/prescriptions/save` | Save AI report |
| `POST` | `/chat/send` | AI triage chat |
| `POST` | `/analyze` | OCR + report synthesis |

## 🔐 Environment Setup

### Frontend (`Frontend/.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_PAGE_SIZE=20
```

### Backend (`backend/.env`)
```
PORT=5000
LOCAL_URL=http://localhost:5000
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_PRESCRIPTION_BUCKET=prescriptions
SUPABASE_PRESCRIPTION_TABLE=Prescription_Reports
SUPABASE_HOSPITALS_TABLE=hospitals
AI_SERVICE_URL=http://localhost:8000
```

### AI Service (`ai-implemen/ai-service/.env`)
```
GEMINI_API_KEY=...
GEMINI_VISION_MODEL=gemini-2.5-flash
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_CHAT_MODEL=gemini-2.5-flash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_PRESCRIPTION_BUCKET=prescriptions
```

## ✅ Quality & Testing
- `npm run lint` and `npm run build` for frontend changes.
- Manual smoke tests for backend endpoints.
- AI service health check: `GET /healthz` and `POST /analyze`.

## 🚀 Deployment Notes
- Frontend can be hosted on **Vercel**.
- Backend + AI service can run on container platforms (Railway, Render, ECS, etc.).
- Supabase remains the managed Postgres/Auth/Storage layer.

## 🧭 Roadmap
- FHIR interoperability (ABDM alignment)
- Offline‑first PWA support
- Multilingual AI responses
- Advanced analytics & operational forecasting

## 📚 References
1. NITI Aayog & RMI, “Reimagining Healthcare in India through Blended Finance,” 2021.
2. ABDM: https://abdm.gov.in/
3. eSanjeevani milestone: https://pib.gov.in/PressReleasePage.aspx?PRID=1952423
