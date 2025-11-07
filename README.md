# Swasthya Setu – India’s Integrated Hospital-Patient Bridge

> Unified digital rails for patients, clinicians, and hospital desks, designed for India’s urban density and rural reach.

## Table of Contents
1. [Mission](#mission)
2. [The Healthcare Problem We Target](#the-healthcare-problem-we-target)
3. [Solution Overview](#solution-overview)
4. [Architecture Overview](#architecture-overview)
5. [Technology Stack](#technology-stack)
6. [Feature Deep Dive](#feature-deep-dive)
    - [Patient Experience](#patient-experience)
    - [Doctor Experience](#doctor-experience)
    - [Receptionist & Hospital Ops](#receptionist--hospital-ops)
    - [Cross-Cutting Capabilities](#cross-cutting-capabilities)
7. [AI & Data Intelligence Layer](#ai--data-intelligence-layer)
8. [Supabase Data Model](#supabase-data-model)
9. [Key API Surface](#key-api-surface)
10. [End-to-End Workflows](#end-to-end-workflows)
11. [Environment Setup](#environment-setup)
12. [Quality, Observability & Testing](#quality-observability--testing)
13. [Security & Compliance Posture](#security--compliance-posture)
14. [Deployment & Scaling Notes](#deployment--scaling-notes)
15. [Implementation Strategy for India](#implementation-strategy-for-india)
16. [Roadmap & Future Enhancements](#roadmap--future-enhancements)
17. [References](#references)

## Mission
- Provide a single digital bridge (“Setu”) that lets Indian hospitals deliver coordinated outpatient care across patients, clinicians, and front-desk teams.
- Reduce queueing, lost paper prescriptions, and disconnected records that delay treatment in both megacities and tier-3 towns.
- Bring AI triage, prescription literacy, and hospital discovery to citizens without forcing them to learn a dozen apps.

## The Healthcare Problem We Target
- **Urban–rural disconnect:** ~65% of Indians live in rural districts while ~75% of the nation’s doctors and tertiary beds are concentrated in urban centres, creating access deserts for millions.[1]
- **Fragmented records:** Many hospitals rely on paper registers or siloed HMS modules; patients carry physical files that are easily damaged or lost.
- **Manual front desks:** Walk-in queues, bed assignment, and billing are still handled in notebooks, which makes scale-up during surges (e.g. dengue season) impossible.
- **Prescription opacity:** Patients often cannot decode a prescription’s latin abbreviations, leading to non-adherence and unsafe self-medication; clinicians have little feedback once the patient leaves.
- **AI adoption gap:** National programs such as ABDM have created digital health IDs, and eSanjeevani has already delivered 150M+ teleconsultations,[2][3] but hospital-side tooling to unify physical and digital care lags behind.

Swasthya Setu positions itself as a pragmatic layer that can sit on top of existing Supabase-backed data stores, expose APIs for any hospital IS, and add AI literacy for patients without compromising clinical governance.

## Solution Overview
Swasthya Setu delivers a tri-portal platform backed by a unified Node.js API and an AI microservice:
- **Next.js 13 Frontend** provides distinct experiences for patients, doctors, and receptionists while reusing shared UI primitives and hooks.
- **Express API (Node.js)** orchestrates Supabase authentication, appointment scheduling, hospital discovery, and operational workflows.
- **FastAPI AI Service** integrates Gemini for prescription OCR, summarisation, and guardrailed AI consultations.
- **Supabase** supplies secure authentication, relational storage, and hosted object storage for documents.

Together they solve day-zero digitisation (registration, scheduling, queues) and layer on day-one intelligence (AI triage, insight dashboards).

## Architecture Overview
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

### Interaction Highlights
- Frontend talks to Express API hosted at `backend/main_server.js`. API unwraps Supabase client for data access with RLS controls.
- AI service lives at `ai-implemen/ai-service/app/main.py`; the frontend sends Base64 prescriptions or chat payloads; backend persists structured outputs via `Prescription_Reports`.
- Supabase storage bucket (`prescriptions`) stores original scans; metadata stored in `Prescription_Reports`, `appointments`, `Doctor_Profile`, etc.

## Technology Stack
| Layer | Technology | Reasoning |
| --- | --- | --- |
| Frontend | Next.js 13 (App Router), TypeScript, Tailwind, framer-motion, radix UI primitives | Server-first React with smooth transitions, reusable UI kit, and strong typing. |
| State & UX | React Context Providers (`ProfileContext`, `DoctorProfileContext`), Axios/fetch | Lightweight state sharing without overfetching. |
| Backend | Node.js (ES Modules), Express, Supabase JS, Multer | Rapid API development with Supabase integration and controlled file uploads. |
| Data | Supabase Postgres, Supabase Auth (email/password), Supabase Storage | Managed infrastructure with row-level security and object storage for scans. |
| AI Service | FastAPI, Google Gemini SDK, Pydantic, Pillow | Async inference, strict schema validation, image pre-processing. |
| AI Guardrails | Custom risk rules (`risk_rules.py`), prompt guardrails, OTC filter | Ensures AI outputs stay informational without prescribing restricted drugs. |
| Deployment Ready | Uvicorn, Nodemon dev scripts, `.env` per module | Supports local dev & cloud containerisation. |

## Feature Deep Dive

### Patient Experience
- **Unified onboarding:** `/auth` page supports registration by role, fetching hospital directory via `/auth/hospitals` and aligning with Supabase Auth.
- **Smart appointment booking:** `Frontend/app/patient/appointments/page.tsx` calls `POST /patient/appointments/book`, auto-generates 15-minute slots, checks overlap using `windowsOverlap` to prevent double-booking, and surfaces meeting links.
- **Prescription literacy:** `analyze-prescription/page.tsx` lets patients upload prescription images; `lib/api.ts` orchestrates AI analysis, merges risk-coded insights, and stores outputs via `/patient/prescriptions/save`.
- **AI triage & OTC guidance:** `ai-consultation/page.tsx` streams chat through `POST /chat/send`, summarises previous reports, enforces triage levels (red/yellow/green), and never recommends Schedule H/X medications.
- **Hospital discovery:** `patient/hospitals/page.tsx` queries `/patient/hospitals/nearby`, applies geospatial filters, and falls back to curated hospital catalogues for offline resilience.
- **Profile & family management:** Context-backed profile editing and storage of family members/records create a longitudinal health timeline.

### Doctor Experience
- **Dashboard snapshot:** `/api/doctor/:doctorId/dashboard` surfaces stats (total appointments, recent patients) with auto-completion of expired appointments.
- **Practice analytics:** `/api/doctor/analytics/stats/:doctorId` aggregates 30-day volumes and unique patients using Supabase count queries.
- **Appointment cockpit:** Doctors view, filter, and create appointments via `GET/POST /api/doctor/:doctorId/appointments`; meeting links are generated as Jitsi rooms (`generateMeetingLink`) and stored in Supabase.
- **Patient roster & records:** `/api/doctor/:doctorId/patients|records|consultations` expose the longitudinal context needed before visits.
- **Prescription workflows:** Clinicians can draft digital prescriptions (`POST /api/doctor/prescriptions`) and trigger AI analysis for validation (`POST /api/doctor/prescriptions/:id/analyze`).

### Receptionist & Hospital Ops
- **Operational dashboard:** `/receptionist/dashboard/stats` counts walk-ins, appointments, admissions, and paid invoices for the day, giving an at-a-glance occupancy snapshot.
- **Appointment desk:** `appointments/page.tsx` handles walk-in bookings, patient lookup, status updates, and integrates with doctor directory caching.
- **Patient registry:** `patients/page.tsx` supports quick registration with validation, fetches all profiles via `/receptionist/patients/all`, and syncs across the organisation instantly.
- **Queue management:** `/receptionist/walkin` endpoints issue tokenised tickets (`A01`, `A02`…), update status, and display live queue progress.
- **Billing & payments:** `/receptionist/billing` endpoints create invoices with incremental invoice numbers and trace payment status.
- **Bed & admission control:** `/receptionist/beds/status` visualises occupancy per ward, while `/receptionist/beds/admit` increments counts and logs admissions.

### Cross-Cutting Capabilities
- **Supabase Auth integration:** All roles share Supabase session semantics; backend gracefully reuses accounts if users already exist.
- **Auto-completion of appointments:** `autoCompleteExpiredAppointments` and `autoCompletePatientAppointments` move outdated appointments to `completed` without manual action.
- **Resilient hospital directory:** `models/hospitals.js` gracefully falls back to static curated hospitals if Supabase queries fail, preserving patient experience during outages.
- **Config-driven environment:** `Frontend/config/env.ts` normalises base URLs, enabling environment parity in dev, staging, and prod.

## AI & Data Intelligence Layer
- **Prescription OCR Pipeline:** `gemini_client.py` decodes base64 images, downscales with Pillow, invokes Gemini Vision, coerces outputs to `PrescriptionData`, and synthesises human-readable sections colour-coded by risk level.
- **Structured persistence:** `createPrescriptionReport` uploads images to Supabase Storage (`prescriptions` bucket), stores structured JSON, and links raw data for audit trails.
- **AI Consultation Guardrails:** `gemini_chat.py` enforces system rules so AI:
  - Flags emergencies (triage `red`) and directs immediate care.
  - Restricts to OTC suggestions; non-OTC items produce clarifying questions instead.
  - References previous prescription summaries to reduce repetition and encourage adherence.
- **Caching & debouncing:** In-memory caches (`_EXTRACT_CACHE`, `_SYNTHESIZE_CACHE`) prevent duplicate AI calls for identical inputs, lowering costs.
- **Attachment intelligence:** Chat attachments are analysed in-line—images pass through OCR, prior reports summarised—to give AI holistic context.

## Supabase Data Model
Key tables and buckets leveraged:
- `Patient_Profile`, `Doctor_Profile`, `receptionist_profile` – master data for each persona.
- `appointments` – shared appointment ledger with start/end ISO fields to support conflict checks.
- `walkin_tickets`, `admissions`, `bed_management` – ground operations.
- `invoices` – revenue tracking with payment timestamps.
- `Prescription_Reports` – structured AI outputs linked to original scans in `prescriptions` bucket.
- `hospitals` (configurable via `SUPABASE_HOSPITALS_TABLE`) – primary hospital directory powering search. Fallback list ensures minimal service even when offline.

## Key API Surface
| Method | Path | Purpose | Source |
| --- | --- | --- | --- |
| `POST` | `/auth/signup/{patient|doctor|receptionist}` | Supabase-backed registration with profile bootstrap | `backend/controllers/authControllers.js` |
| `POST` | `/auth/signin/{role}` | Role-specific login flow | same |
| `GET` | `/auth/hospitals` | Hospital directory for onboarding | `hospitalController.js` |
| `GET` | `/receptionist/dashboard/stats` | Live KPIs (appointments, beds, revenue) | `receptionistController.js` |
| `POST` | `/receptionist/appointments/create` | Create appointment from front desk | same |
| `GET` | `/patient/appointments/list` | Patient view of upcoming visits | `patientController.js` |
| `POST` | `/patient/appointments/book` | Self-service appointment booking | same |
| `POST` | `/patient/prescriptions/save` | Store AI analysed prescription | `patientController.js` + `prescriptions.js` |
| `GET` | `/api/doctor/{doctorId}/appointments` | Doctor schedule | `doctorController.js` |
| `POST` | `/api/doctor/appointments/{id}/create-meeting` | Generate Jitsi meeting link | same |
| `POST` | `/patient/hospitals/nearby` | Geo-aware hospital search | `hospitalController.js` |
| `POST` | `/chat/send` | AI consultation turn | `ai-implemen/ai-service/app/gemini_chat.py` |
| `POST` | `/analyze` | Prescription OCR and report synthesis | `ai-implemen/ai-service/app/main.py` |

## End-to-End Workflows
1. **Registration & Identity**
   - Citizen chooses a role on `/auth`, Supabase creates credentials, and role-specific profile rows are inserted.
   - Doctors & receptionists link to hospitals selected from Supabase-managed directory.
2. **Appointment Lifecycle**
   - Patients discover doctors, request slots, backend validates overlaps, and schedules stored in `appointments`.
   - Receptionists can override status or add walk-ins; doctors auto-complete past appointments to `completed`.
3. **Consultation & Documentation**
   - Doctors issue prescriptions (paper or digital). Patients upload scans; AI service extracts meds, vitals, and risk-coded instructions.
   - Reports saved to Supabase; attachments surface inside AI chat for future consults.
4. **Hospital Operations**
   - Walk-in tickets minted sequentially (`A01`, `A02`). Dashboards show queue and today’s revenue.
   - Bed admissions update occupancy instantly; if ward is full, backend guards against over-allocation.
5. **AI Consultation**
   - Patient opens AI chat, includes context (age, meds). Gemini responds with triage level, OTC advice, disclaimers, and escalates emergencies.

## Environment Setup
### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10 (for FastAPI worker)
- Supabase project (URL, anon key, service role key)
- Google Gemini API key (for AI features)

### Frontend (`Frontend/`)
```bash
cd Frontend
npm install
npm run dev        # http://localhost:3000
npm run lint       # ESLint + Tailwind rules
npm run build      # Production build check
```

Set `Frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8001
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_PAGE_SIZE=20
```

### Backend (`backend/`)
```bash
cd backend
npm install
npm run dev         # nodemon, http://localhost:5000
```

`backend/.env` essentials:
```
PORT=5000
LOCAL_URL=http://localhost:5000
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_PRESCRIPTION_BUCKET=prescriptions
SUPABASE_PRESCRIPTION_TABLE=Prescription_Reports
SUPABASE_HOSPITALS_TABLE=hospitals
AI_SERVICE_URL=http://localhost:8001
```

### AI Service (`ai-implemen/ai-service/`)
```bash
cd ai-implemen/ai-service
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

`.env` requirements:
```
GEMINI_API_KEY=<google-gemini-key>
GEMINI_VISION_MODEL=gemini-2.5-flash
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_CHAT_MODEL=gemini-2.5-flash
SUPABASE_URL=<same as backend>
SUPABASE_SERVICE_ROLE_KEY=<service role key for storage writes>
SUPABASE_PRESCRIPTION_BUCKET=prescriptions
```

## Quality, Observability & Testing
- **Linting:** `npm run lint` (Frontend), `npm run lint`/custom scripts in backend as available.
- **Build verification:** `npm run build` ensures Next.js routes compile before release.
- **Manual smoke tests:**
  - Use Thunder Client/Postman for `/auth`, `/patient`, `/receptionist` routes.
  - `curl -X POST http://localhost:8001/analyze` with sample base64 data ensures AI pipeline healthy.
  - Hit `/healthz` on FastAPI and `/` on Express for readiness.
- **Logging:** Console logs in controllers flagged for future replacement with structured logging (e.g. pino/winston) and log redaction of PII.

## Security & Compliance Posture
- **Supabase RLS:** Supabase provides row-level security; service role keys are kept server-side only.
- **Sensitive data isolation:** AI service stores raw prescriptions in secure bucket; URLs can be restricted to signed URLs in production.
- **PHI safeguards:** `risk_rules` and chat guardrails prevent AI from issuing prescriptions, focusing on education with disclaimers.
- **Credential handling:** `.env` per module with `.env.example` updates recommended to promote secure onboarding.
- **Audit readiness:** Stored reports retain raw extracted data plus AI summary, allowing clinicians to audit AI output.

## Deployment & Scaling Notes
- **Containerisation:** Both backend and AI service are 12-factor ready; environment variables control endpoints.
- **Stateless services:** All session data lives in Supabase; horizontal scaling is a matter of adding replicas behind a load balancer.
- **Edge caching:** Hospital directory responses can be cached at CDN edges; fallback strategies already present for offline support.
- **Background jobs:** Long-term, move appointment auto-complete into cron/Edge Functions to decouple from request latency.
- **Monitoring hooks:** Add health probes (`/healthz`) to k8s or ECS tasks, and wire Cloud Logging or Supabase logs into observability stack.

## Implementation Strategy for India
1. **Urban private hospitals:** Integrate with existing HMS via REST APIs; supabase tables can mirror HMS data. Focus on front-desk efficiency and analytics.
2. **District hospitals & PHCs:** Deploy lightweight tablets with receptionist portal + AI prescription literacy, enabling rural patients to understand medication regimens even without the doctor present.
3. **ABDM alignment:** Map Supabase patient IDs to ABHA numbers for interoperability; push prescription summaries to personal health records down the line.
4. **Language localisation:** UI copy leverages Tailwind/React components; internationalisation layer can plug in to deliver Hindi/local language interfaces.
5. **Connectivity resilience:** Hospital directory fallback and cached AI reports mean front desks can keep operating on flaky networks.
6. **Training & adoption:** Provide SOPs for queue management, invoice tracking, and AI chat disclaimers; start with hybrid pilots that combine digital queue + paper backup.

## Roadmap & Future Enhancements
- **EHR interoperability:** FHIR mapping layer to exchange data with ABDM gateways.
- **Offline-first PWA:** Cache key pages and queue operations for low-bandwidth regions.
- **Vitals integration:** Plug in Bluetooth vitals devices and auto-populate patient dashboards.
- **Analytics deep dive:** Introduce cohort analysis, revenue leakage detection, and doctor performance dashboards.
- **Multilingual AI:** Fine-tune prompts to answer in local languages while maintaining guardrails.
- **Role-based access controls:** Granular permissions (e.g. lab technicians) with Supabase policies.
- **Automated follow-ups:** SMS/WhatsApp reminders for medication adherence and appointment confirmations.

## References
1. NITI Aayog & Rocky Mountain Institute, “Reimagining Healthcare in India through Blended Finance,” 2021. https://www.niti.gov.in/sites/default/files/2021-11/Healthcare-Sector.pdf  
2. Ministry of Health & Family Welfare, Ayushman Bharat Digital Mission (ABDM). https://abdm.gov.in/  
3. Press Information Bureau, Government of India, “eSanjeevani crosses 150 million teleconsultations,” 2023. https://pib.gov.in/PressReleasePage.aspx?PRID=1952423

