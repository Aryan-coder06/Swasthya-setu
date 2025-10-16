// File Location: SWAS/Frontend/lib/api.ts

import type { AnalysisResponse } from "./types";

// This URL points to your Python AI service, which you are running on port 8001
const API_BASE_URL = "http://localhost:8001";

export async function analyzePrescription(base64Image: string): Promise<AnalysisResponse> {
  const res = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ base64_image: base64Image }),
  });

  let payload = { status: "error", message: "Failed to parse server response.", report: null };
  try {
    payload = await res.json();
  } catch (e) {
    console.error("JSON parsing error:", e);
  }

  if (!res.ok) {
    const errorDetail = payload?.message || "An unknown server error occurred.";
    return {
      status: "error",
      message: `Error: ${errorDetail}`,
      report: null,
    };
  }

  return payload as AnalysisResponse;
}