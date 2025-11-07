import supabase from "../main_server.js";
import { HOSPITALS_TABLE } from "../config/constants.js";
import {
  createNotification,
  createNotificationBatch,
} from "./notifications.js";
import {
  create_appointment,
} from "./receptionist_models.js";

const REQUESTS_TABLE = "appointment_requests";
const PATIENT_TABLE = "Patient_Profile";
const DOCTOR_TABLE = "Doctor_Profile";
const RECEPTIONIST_TABLE = "receptionist_profile";

const fetchPatientName = async (patientId) => {
  if (!patientId) return null;
  const { data, error } = await supabase
    .from(PATIENT_TABLE)
    .select("firstName, lastName")
    .eq("id", patientId)
    .maybeSingle();
  if (error) return null;
  const first = data?.firstName?.trim() ?? "";
  const last = data?.lastName?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  return full || null;
};

const fetchHospital = async (hospitalId) => {
  if (!hospitalId) return { name: null };
  const { data, error } = await supabase
    .from(HOSPITALS_TABLE)
    .select("id, name")
    .eq("id", hospitalId)
    .maybeSingle();
  if (error) return { name: null };
  return { id: data?.id, name: data?.name ?? null };
};

const fetchReceptionistsForHospital = async (hospitalId) => {
  if (!hospitalId) return [];
  const { data, error } = await supabase
    .from(RECEPTIONIST_TABLE)
    .select("id, firstname, lastname")
    .eq("hospital_id", hospitalId);
  if (error) {
    console.error("Failed to load receptionists for notifications:", error);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    firstName: row.firstname ?? "",
    lastName: row.lastname ?? "",
  }));
};

const fetchDoctorName = async (doctorId) => {
  if (!doctorId) return null;
  const { data, error } = await supabase
    .from(DOCTOR_TABLE)
    .select("firstName, lastName")
    .eq("id", doctorId)
    .maybeSingle();
  if (error) return null;
  const first = data?.firstName?.trim() ?? "";
  const last = data?.lastName?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  return full || null;
};

export const createAppointmentRequest = async ({
  patientId,
  hospitalId,
  doctorId,
  preferredSpecialty,
  preferredDate,
  preferredTime,
  notes,
}) => {
  const patientName =
    (await fetchPatientName(patientId)) ?? "Patient";
  const hospitalInfo = await fetchHospital(hospitalId);

  const insertPayload = {
    patient_id: patientId,
    patient_name: patientName,
    hospital_id: hospitalId,
    hospital_name: hospitalInfo.name,
    doctor_id: doctorId ?? null,
    preferred_specialty: preferredSpecialty ?? null,
    preferred_date: preferredDate ?? null,
    preferred_time: preferredTime ?? null,
    notes: notes ?? null,
    status: "pending",
  };

  const { data: inserted, error } = await supabase
    .from(REQUESTS_TABLE)
    .insert([insertPayload])
    .select()
    .single();

  if (error) {
    return { data: null, error };
  }

  // notify receptionists linked to hospital
  const receptionists = await fetchReceptionistsForHospital(hospitalId);
  if (receptionists.length) {
    await createNotificationBatch(
      receptionists.map((receptionist) => ({
        recipientId: receptionist.id,
        recipientRole: "receptionist",
        title: "New appointment request",
        message: `${patientName} requested an appointment${hospitalInfo.name ? ` at ${hospitalInfo.name}` : ""}.`,
        data: {
          requestId: inserted.id,
          patientId,
          hospitalId,
          preferredDate,
          preferredTime,
        },
      }))
    );
  }

  return { data: inserted, error: null };
};

export const listAppointmentRequestsForHospital = async ({
  hospitalId,
  status = "pending",
}) => {
  let query = supabase
    .from(REQUESTS_TABLE)
    .select("*")
    .eq("hospital_id", hospitalId)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
};

export const listAppointmentRequestsForPatient = async (patientId) => {
  const { data, error } = await supabase
    .from(REQUESTS_TABLE)
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
};

export const respondToAppointmentRequest = async ({
  requestId,
  action,
  receptionistId,
  doctorId,
  appointmentDate,
  appointmentTime,
  declineReason,
  notes,
  hospitalId,
}) => {
  const { data: existing, error: fetchError } = await supabase
    .from(REQUESTS_TABLE)
    .select("*")
    .eq("id", requestId)
    .single();
  if (fetchError) {
    return { error: fetchError };
  }
  if (!existing) {
    return { error: { message: "Appointment request not found." } };
  }
  if (existing.status !== "pending") {
    return { error: { message: "Request has already been processed." } };
  }
  if (hospitalId && existing.hospital_id && existing.hospital_id !== hospitalId) {
    return { error: { message: "You are not authorised to manage this request." } };
  }

  if (action === "accept") {
    if (!doctorId || !appointmentDate || !appointmentTime) {
      return {
        error: {
          message:
            "doctorId, appointmentDate, and appointmentTime are required to accept a request.",
        },
      };
    }

    const { data: appointmentData, error: appointmentError } = await create_appointment({
      patientId: existing.patient_id,
      patientName: existing.patient_name,
      doctorId,
      appointmentDate,
      appointmentTime,
      status: "confirmed",
    });

    if (appointmentError || !appointmentData) {
      return {
        error:
          appointmentError || { message: "Failed to create appointment for request." },
      };
    }

    const { data: updated, error: updateError } = await supabase
      .from(REQUESTS_TABLE)
      .update({
        status: "accepted",
        receptionist_id: receptionistId,
        doctor_id: doctorId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        appointment_id: appointmentData.id,
        response_at: new Date().toISOString(),
        notes: notes ?? existing.notes,
      })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) {
      return { error: updateError };
    }

    // Notifications for patient and doctor
    const notificationJobs = [];
    if (existing.patient_id) {
      notificationJobs.push(
        createNotification({
          recipientId: existing.patient_id,
          recipientRole: "patient",
          title: "Appointment confirmed",
          message: `Your appointment has been scheduled on ${appointmentDate} at ${appointmentTime}.`,
          data: {
            requestId,
            appointmentId: appointmentData.id,
            doctorId,
            hospitalId: existing.hospital_id,
          },
        })
      );
    }
    notificationJobs.push(
      createNotification({
        recipientId: doctorId,
        recipientRole: "doctor",
        title: "New appointment assigned",
        message: `${existing.patient_name || "Patient"} has been booked on ${appointmentDate} at ${appointmentTime}.`,
        data: {
          requestId,
          appointmentId: appointmentData.id,
        },
      })
    );
    await Promise.all(notificationJobs);

    return { data: { request: updated, appointment: appointmentData }, error: null };
  }

  if (action === "decline") {
    const { data: updated, error: updateError } = await supabase
      .from(REQUESTS_TABLE)
      .update({
        status: "declined",
        receptionist_id: receptionistId,
        response_at: new Date().toISOString(),
        decline_reason: declineReason ?? null,
        notes: notes ?? existing.notes,
      })
      .eq("id", requestId)
      .select()
      .single();

    if (updateError) {
      return { error: updateError };
    }

    if (existing.patient_id) {
      await createNotification({
        recipientId: existing.patient_id,
        recipientRole: "patient",
        title: "Appointment request update",
        message: declineReason
          ? `Your appointment request was declined: ${declineReason}`
          : "Your appointment request was declined.",
        data: {
          requestId,
        },
      });
    }

    return { data: { request: updated }, error: null };
  }

  return { error: { message: "Unsupported action. Use 'accept' or 'decline'." } };
};
