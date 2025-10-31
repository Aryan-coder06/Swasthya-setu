# Repository Guidelines

## Project Structure & Module Organization
- `Frontend/`: Next.js 13 (app router). UI primitives in `components/`, feature layouts under `app/`, shared logic in `hooks/`. Tailwind config lives in `tailwind.config.ts`.
- `backend/`: Express API. Request flow: `routes/` → `controllers/` → `models/`; `main_server.js` wires middleware and the Supabase client.
- `ai-implemen/ai-service/`: FastAPI worker for prescription OCR and chat. Core pipelines sit in `app/`. Keep `requirements.txt` synced with deployments.
- Store secrets per module (`Frontend/.env.local`, `backend/.env`, `ai-implemen/ai-service/.env`) and keep them out of Git.

## Build, Test, and Development Commands
- `cd Frontend && npm install && npm run dev` (`http://localhost:3000`). Run `npm run build` before PRs; `npm run lint` enforces ESLint and Tailwind rules.
- `cd backend && npm install && npm run dev` (`http://localhost:5000`). Requires `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `PORT` in `.env`.
- `cd ai-implemen/ai-service && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`; start with `uvicorn app.main:app --reload --port 8001`.

## Coding Style & Naming Conventions
- Frontend: TypeScript, function components, PascalCase components, camelCase hooks/utilities, 2-space indentation. Lean on Tailwind utilities over ad-hoc CSS.
- Backend: ES modules with async/await; keep handlers focused and return JSON. Match existing double-quote style and 2-space indents.
- FastAPI: Define request/response schemas in `app/schemas.py` (PascalCase) and align endpoint names with REST nouns. Keep formatting consistent; run `ruff`/`black` if available.

## Testing Guidelines
- No automated suite yet. Always run `npm run lint` and `npm run build` for frontend changes.
- Smoke-test backend endpoints via Thunder Client/Postman and record sample requests in the PR description.
- For the AI service, hit `/healthz` and `/analyze` with sanitized fixtures (`curl -X POST http://localhost:8001/analyze ...`). Note any manual verification gaps.

## Commit & Pull Request Guidelines
- Use short, imperative commits: `feat: add receptionist OTP flow`. Reference issue IDs in the body when applicable.
- Branch naming: `feat/*`, `fix/*`, `chore/*`. Rebase onto the latest `Frontend`, `Backend`, or `main` before opening a PR.
- PRs should explain scope, modules touched, environment updates, and test evidence (commands run, screenshots, or curl output). Flag follow-up tasks if coverage is missing.

## Security & Configuration Tips
- Keep Supabase and Gemini keys outside version control; update `.env.example` entries whenever new variables are introduced.
- Scrub patient-identifiable data from logs and screenshots before sharing.
- Rotate API keys after demos and revoke unused service tokens promptly.
        