// File Location: SWAS/Frontend/lib/api.ts

import type { AnalysisResponse, SavePrescriptionPayload, SavePrescriptionResponse } from "./types";
import { aiRoute, apiRoute } from "@/config/env";

export async function analyzePrescription(base64Image: string): Promise<AnalysisResponse> {
  const res = await fetch(aiRoute("/analyze"), {
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

export async function savePrescriptionReport(
  payload: SavePrescriptionPayload
): Promise<SavePrescriptionResponse> {
  const formData = new FormData();
  formData.append("patientId", payload.patientId);
  formData.append("report", JSON.stringify(payload.report));
  if (payload.file) {
    formData.append("file", payload.file, payload.file.name);
  }

  const res = await fetch(apiRoute("/patient/prescriptions/save"), {
    method: "POST",
    body: formData,
  });

  let json: any = null;
  try {
    json = await res.json();
  } catch (error) {
    console.error("Failed to parse save report response", error);
  }

  if (!res.ok) {
    const message = json?.error || json?.message || "Unable to save prescription report.";
    return { success: false, message };
  }

  return {
    success: true,
    message: json?.message || "Prescription report saved successfully.",
    recordId: json?.data?.id ?? json?.id ?? undefined,
    imageUrl: json?.data?.image_url ?? json?.image_url ?? null,
  };
}
