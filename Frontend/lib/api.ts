// File Location: SWAS/Frontend/lib/api.ts

import type {
  AnalysisResponse,
  SavePrescriptionPayload,
  SavePrescriptionResponse,
  NotificationRecord,
  AppointmentRequest,
  ReceptionistProfile,
  WalkInTicket,
  InvoiceRecord,
  AppointmentRecord,
  DoctorSummary,
} from "./types";
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

type ApiJson<T> = { data?: T; message?: string; error?: string };

const normaliseReceptionist = (profile: any): ReceptionistProfile => {
  if (!profile || typeof profile !== "object") {
    return profile as ReceptionistProfile;
  }
  const merged: any = { ...profile };
  merged.firstName = merged.firstName ?? merged.firstname ?? null;
  merged.lastName = merged.lastName ?? merged.lastname ?? null;
  const phone = merged.phone_no ?? merged.phoneNo ?? null;
  merged.phone_no = phone;
  merged.phoneNo = phone;
  const hospitalId = merged.hospital_id ?? merged.hospitalId ?? null;
  merged.hospital_id = hospitalId;
  merged.hospitalId = hospitalId;
  const hospitalName = merged.hospital_name ?? merged.hospitalName ?? null;
  merged.hospital_name = hospitalName;
  merged.hospitalName = hospitalName;
  if (merged.age !== null && merged.age !== undefined) {
    const ageNumber = Number(merged.age);
    merged.age = Number.isNaN(ageNumber) ? merged.age : ageNumber;
  }
  return merged as ReceptionistProfile;
};

export async function requestAppointment(payload: {
  patientId: string;
  hospitalId: string;
  doctorId?: string | null;
  preferredSpecialty?: string | null;
  preferredDate?: string | null;
  preferredTime?: string | null;
  notes?: string | null;
}): Promise<AppointmentRequest> {
  const res = await fetch(apiRoute("/patient/appointments/request"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json: ApiJson<AppointmentRequest> = await res.json();
  if (!res.ok || !json.data) {
    throw new Error(json.error || "Failed to submit appointment request.");
  }
  return json.data;
}

export async function getPatientAppointmentRequests(patientId: string): Promise<AppointmentRequest[]> {
  const url = new URL(apiRoute("/patient/appointments/requests"));
  url.searchParams.set("patientId", patientId);

  const res = await fetch(url.toString());
  const json: ApiJson<AppointmentRequest[]> = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to load appointment requests.");
  }
  return json.data || [];
}

export async function getReceptionistAppointmentRequests(params: {
  receptionistId: string;
  status?: string;
}): Promise<{ requests: AppointmentRequest[]; hospital?: { id: string; name: string } }> {
  const url = new URL(apiRoute("/receptionist/appointments/requests"));
  url.searchParams.set("receptionistId", params.receptionistId);
  if (params.status) url.searchParams.set("status", params.status);

  const res = await fetch(url.toString());
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || "Failed to load appointment requests.");
  }
  return {
    requests: Array.isArray(json?.data) ? (json.data as AppointmentRequest[]) : [],
    hospital: json?.hospital,
  };
}

export async function respondToAppointmentRequestApi(options: {
  requestId: string;
  action: "accept" | "decline";
  receptionistId: string;
  doctorId?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  declineReason?: string;
  notes?: string;
}): Promise<any> {
  const { requestId, ...payload } = options;
  const res = await fetch(apiRoute(`/receptionist/appointments/requests/${requestId}/respond`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || "Failed to update appointment request.");
  }
  return json;
}

export async function fetchNotifications(params: {
  recipientId: string;
  recipientRole: "patient" | "doctor" | "receptionist";
  status?: "unread" | "read" | "dismissed";
  limit?: number;
}): Promise<NotificationRecord[]> {
  const url = new URL(apiRoute("/notifications"));
  url.searchParams.set("recipientId", params.recipientId);
  url.searchParams.set("recipientRole", params.recipientRole);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.limit) url.searchParams.set("limit", params.limit.toString());

  const res = await fetch(url.toString());
  const json: ApiJson<NotificationRecord[]> = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to load notifications.");
  }
  return json.data || [];
}

export async function markNotificationReadApi(id: string): Promise<void> {
  const res = await fetch(apiRoute(`/notifications/${id}/read`), {
    method: "POST",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error || "Failed to mark notification read.");
  }
}

export async function dismissNotificationApi(id: string): Promise<void> {
  const res = await fetch(apiRoute(`/notifications/${id}/dismiss`), {
    method: "POST",
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error || "Failed to dismiss notification.");
  }
}

export async function markAllNotificationsReadApi(payload: {
  recipientId: string;
  recipientRole: "patient" | "doctor" | "receptionist";
}): Promise<void> {
  const res = await fetch(apiRoute("/notifications/read-all"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json?.error || "Failed to mark notifications as read.");
  }
}

type ReceptionistProfileUpdate = Partial<{
  firstName: string;
  lastName: string;
  phone_no: string;
  phoneNo: string;
  gender: string;
  age: number | string;
  hospitalId: string;
}>;

export async function getReceptionistProfileApi(id: string): Promise<ReceptionistProfile> {
  const res = await fetch(apiRoute(`/receptionist/profile/${id}`));
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || "Failed to load receptionist profile.");
  }
  return normaliseReceptionist(json?.data);
}

export async function updateReceptionistProfileApi(
  id: string,
  payload: ReceptionistProfileUpdate
): Promise<ReceptionistProfile> {
  const res = await fetch(apiRoute(`/receptionist/profile/${id}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || "Failed to update receptionist profile.");
  }
  return normaliseReceptionist(json?.data);
}

export async function createWalkInTicketApi(patientName: string, receptionistId: string): Promise<WalkInTicket> {
  const res = await fetch(apiRoute("/receptionist/walkin/create"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientName, receptionistId }),
  });
  const json: ApiJson<WalkInTicket> = await res.json();
  if (!res.ok || !json.data) {
    throw new Error(json.error || "Failed to create walk-in ticket.");
  }
  return json.data;
}

export async function createReceptionistAppointmentApi(payload: {
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  patientId?: string | null;
  patientName?: string | null;
  status?: string;
}): Promise<AppointmentRecord> {
  const res = await fetch(apiRoute("/receptionist/appointments/create"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      doctorId: payload.doctorId,
      date: payload.appointmentDate,
      time: payload.appointmentTime,
      patientId: payload.patientId ?? null,
      patientName: payload.patientName ?? null,
      status: payload.status ?? "confirmed",
    }),
  });
  const json: ApiJson<AppointmentRecord> = await res.json();
  if (!res.ok || !json.data) {
    throw new Error(json.error || "Failed to schedule appointment.");
  }
  return json.data;
}

export async function createInvoiceApi(payload: {
  patientName: string;
  amount: number;
  services?: string[];
}, receptionistId: string): Promise<InvoiceRecord> {
  const res = await fetch(apiRoute("/receptionist/billing/create"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      patientName: payload.patientName,
      amount: payload.amount,
      services: payload.services ?? [],
      receptionistId,
    }),
  });
  const json: ApiJson<InvoiceRecord> = await res.json();
  if (!res.ok || !json.data) {
    throw new Error(json.error || "Failed to create invoice.");
  }
  return json.data;
}

export async function fetchInvoicesApi(receptionistId: string): Promise<InvoiceRecord[]> {
  const url = new URL(apiRoute("/receptionist/billing/all"));
  url.searchParams.set("receptionistId", receptionistId);
  const res = await fetch(url.toString());
  const json: ApiJson<InvoiceRecord[]> = await res.json();
  if (!res.ok) {
    throw new Error(json.error || "Failed to load invoices.");
  }
  return json.data ?? [];
}

export async function fetchDoctorsForHospitalApi(hospitalId: string): Promise<DoctorSummary[]> {
  const url = new URL(apiRoute("/receptionist/doctors/all"));
  url.searchParams.set("hospitalId", hospitalId);
  const res = await fetch(url.toString());
  if (res.status === 404) {
    return [];
  }
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json?.error || "Failed to load doctors for hospital.");
  }
  return Array.isArray(json) ? (json as DoctorSummary[]) : Array.isArray(json?.data) ? (json.data as DoctorSummary[]) : [];
}
