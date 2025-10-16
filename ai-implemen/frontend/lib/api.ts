// lib/api.ts
import type { AnalysisResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export async function analyzePrescription(base64Image: string): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64_image: base64Image }),
  });

  let payloadText = "";
  try { payloadText = await res.text(); } catch {}
  const isJSON = (res.headers.get("content-type") || "").includes("application/json");
  const payload = isJSON && payloadText ? JSON.parse(payloadText) : payloadText;

  if (!res.ok) {
    const detail =
      typeof payload === "string"
        ? payload
        : payload?.detail
          ? (typeof payload.detail === "string" ? payload.detail : JSON.stringify(payload.detail))
          : "Server responded with an error.";

    return {
      status: "error",
      message: `HTTP ${res.status}: ${detail}`,
      report: null,
    };
  }

  return payload as AnalysisResponse;
}
