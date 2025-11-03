const normalizeBase = (value: string | undefined, fallback: string) => {
  if (!value || !value.trim()) return fallback;
  return value.trim().replace(/\/+$/, "");
};

export const API_BASE_URL = normalizeBase(
  process.env.NEXT_PUBLIC_API_URL,
  "http://localhost:5000"
);

export const AI_SERVICE_URL = normalizeBase(
  process.env.NEXT_PUBLIC_AI_SERVICE_URL,
  "http://localhost:8000"
);

export const DEFAULT_PAGE_SIZE = Number(process.env.NEXT_PUBLIC_PAGE_SIZE || 20);

export const FRONTEND_ORIGIN = normalizeBase(
  process.env.NEXT_PUBLIC_FRONTEND_URL,
  "http://localhost:3000"
);

export const ENV = {
  API_BASE_URL,
  AI_SERVICE_URL,
  DEFAULT_PAGE_SIZE,
  FRONTEND_ORIGIN,
};

export const apiRoute = (path: string) => `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
export const aiRoute = (path: string) => `${AI_SERVICE_URL}${path.startsWith("/") ? path : `/${path}`}`;
