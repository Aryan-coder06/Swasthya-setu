import supabase from "../main_server.js";
import { register_patient } from "./receptionist_models.js";

const STORAGE_BUCKET = "User_Docs";

const generateMeetingLink = (appointmentId) => {
  const roomName = `SwasthyaSetu-Consultation-${appointmentId}-${Date.now()}`;
  return `https://meet.jit.si/${roomName}`;
};

const saveMeetingLink = async (appointmentId, meetingLink) => {
  return supabase
    .from("appointments")
    .update({ meeting_link: meetingLink })
    .eq("id", appointmentId)
    .select()
    .single();
};

const getDoctorProfile = async (doctorId) => {
  return supabase
    .from("Doctor_Profile")
    .select("*")
    .eq("id", doctorId)
    .single();
};

const updateDoctorProfile = async (doctorId, updates) => {
  const payload = {};

  if (updates.firstName !== undefined) payload.firstName = updates.firstName;
  if (updates.lastName !== undefined) payload.lastName = updates.lastName;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.specialty !== undefined) payload.specs = updates.specialty;
  if (updates.gender !== undefined) payload.gender = updates.gender;
  if (updates.age !== undefined) payload.age = updates.age;

  if (Object.keys(payload).length === 0) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from("Doctor_Profile")
    .update(payload)
    .eq("id", doctorId)
    .select()
    .single();

  return { data, error };
};

const getDoctorAnalytics = async (doctorId) => {
  const baseQuery = supabase.from("appointments");

  const thirtyDaysAgoIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [totalResp, recentResp, patientResp] = await Promise.all([
    baseQuery.select("id", { count: "exact", head: true }).eq("doctor_id", doctorId),
    baseQuery.select("id", { count: "exact", head: true }).eq("doctor_id", doctorId).gte("appointment_date", thirtyDaysAgoIso),
    baseQuery.select("patient_id, patient_name").eq("doctor_id", doctorId),
  ]);

  if (totalResp.error) return { data: null, error: totalResp.error };
  if (recentResp.error) return { data: null, error: recentResp.error };

  let patientRows = patientResp.data || [];
  let patientError = patientResp.error || null;

  if (patientError && patientError.message?.includes("patient_id")) {
    const fallback = await baseQuery.select("patient_name").eq("doctor_id", doctorId);
    patientRows = fallback.data || [];
    patientError = fallback.error || null;
  }

  if (patientError) {
    return { data: null, error: patientError };
  }

  const uniquePatients = new Set();
  patientRows.forEach((row) => {
    if (row.patient_id) uniquePatients.add(row.patient_id);
    else if (row.patient_name) uniquePatients.add(row.patient_name.trim().toLowerCase());
  });

  return {
    data: {
      totalAppointments: totalResp.count || 0,
      recentAppointments: recentResp.count || 0,
      totalUniquePatients: uniquePatients.size,
    },
    error: null,
  };
};

const getDoctorAppointments = async (doctorId) => {
  const result = await supabase
    .from("appointments")
    .select("*")
    .eq("doctor_id", doctorId)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  return {
    data: result.data || [],
    error: result.error || null,
  };
};

const createDoctorAppointment = async (doctorId, payload) => {
  const insertBody = {
    doctor_id: doctorId,
    patient_name: payload.patientName || null,
    appointment_date: payload.appointmentDate,
    appointment_time: payload.appointmentTime,
    status: payload.status || "confirmed",
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("appointments").insert([insertBody]).select().single();
  if (error) return { data: null, error };

  if (payload.mode === "video") {
    const meetingLink = generateMeetingLink(data.id);
    const saveResult = await saveMeetingLink(data.id, meetingLink);
    if (!saveResult.error) {
      return { data: { ...data, meeting_link: meetingLink }, error: null };
    }
  }

  return { data, error: null };
};

const updateDoctorAppointmentStatus = async (appointmentId, updates) => {
  const allowed = {};

  if (updates.status !== undefined) allowed.status = updates.status;
  if (updates.meeting_link !== undefined) allowed.meeting_link = updates.meeting_link;

  if (Object.keys(allowed).length === 0) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from("appointments")
    .update(allowed)
    .eq("id", appointmentId)
    .select()
    .single();

  return { data, error };
};

const addPatientForDoctor = async (_doctorId, payload) => {
  const registration = await register_patient({
    firstName: payload.firstName,
    lastName: payload.lastName,
    email: payload.email || null,
    phone_no: payload.phone || null,
    gender: payload.gender || null,
    age: payload.age || null,
  });

  if (registration.error) {
    return { data: null, error: registration.error };
  }

  return { data: registration.data, error: null };
};

const buildPatientList = async (doctorId) => {
  const appointmentResult = await getDoctorAppointments(doctorId);
  if (appointmentResult.error) {
    return { data: null, error: appointmentResult.error };
  }

  const patientsMap = new Map();
  (appointmentResult.data || []).forEach((row) => {
    const key = row.patient_id || row.patient_name || `apt-${row.id}`;
    const name = row.patient_name || "Unknown Patient";

    const existing = patientsMap.get(key) || {
      id: row.patient_id || null,
      fullName: name,
      firstName: name.split(" ")[0] || name,
      lastName: name.split(" ").slice(1).join(" ") || "",
      lastVisit: null,
      status: row.status || "confirmed",
    };

    if (!existing.lastVisit || (row.appointment_date && row.appointment_date > existing.lastVisit)) {
      existing.lastVisit = row.appointment_date;
      existing.status = row.status || existing.status;
    }

    patientsMap.set(key, existing);
  });

  const withIds = Array.from(patientsMap.values()).filter((patient) => patient.id);
  if (withIds.length) {
    const { data, error } = await supabase
      .from("Patient_Profile")
      .select("id, firstName, lastName, email, phone_no, gender, age")
      .in(
        "id",
        withIds.map((p) => p.id)
      );

    if (!error && data) {
      const profileMap = new Map(data.map((item) => [item.id, item]));
      patientsMap.forEach((patient, key) => {
        if (patient.id && profileMap.has(patient.id)) {
          const profile = profileMap.get(patient.id);
          patientsMap.set(key, {
            ...patient,
            firstName: profile.firstName || patient.firstName,
            lastName: profile.lastName || patient.lastName,
            fullName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || patient.fullName,
            email: profile.email || "",
            phone: profile.phone_no || "",
            gender: profile.gender || null,
            age: profile.age || null,
          });
        }
      });
    }
  }

  const list = Array.from(patientsMap.values()).sort((a, b) => {
    if (!a.lastVisit && !b.lastVisit) return 0;
    if (!a.lastVisit) return 1;
    if (!b.lastVisit) return -1;
    return a.lastVisit < b.lastVisit ? 1 : -1;
  });

  return { data: list, error: null };
};

const getDoctorPatients = (doctorId) => buildPatientList(doctorId);

const getDoctorRecords = async (doctorId) => {
  const patientResult = await buildPatientList(doctorId);
  if (patientResult.error) {
    return { data: null, error: patientResult.error };
  }

  const patients = patientResult.data || [];
  const ids = patients.map((p) => p.id).filter(Boolean);
  if (!ids.length) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase
    .from("Patient_Profile")
    .select("id, firstName, lastName, docs")
    .in("id", ids);

  if (error) {
    return { data: null, error };
  }

  const records = [];
  for (const row of data || []) {
    const documents = Array.isArray(row.docs) ? row.docs : [];
    const entry = {
      patientId: row.id,
      patientName: `${row.firstName || ""} ${row.lastName || ""}`.trim(),
      documents: [],
    };

    for (const doc of documents) {
      if (!doc?.path) continue;
      const { data: signed, error: signedError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(doc.path, 60 * 60);

      if (!signedError && signed?.signedUrl) {
        entry.documents.push({
          type: doc.type || "document",
          path: doc.path,
          url: signed.signedUrl,
        });
      }
    }

    records.push(entry);
  }

  return { data: records, error: null };
};

const getDoctorDashboardSummary = async (doctorId) => {
  const [profile, analytics, appointments] = await Promise.all([
    getDoctorProfile(doctorId),
    getDoctorAnalytics(doctorId),
    getDoctorAppointments(doctorId),
  ]);

  if (profile.error) return { data: null, error: profile.error };
  if (analytics.error) return { data: null, error: analytics.error };
  if (appointments.error) return { data: null, error: appointments.error };

  const todayKey = new Date().toISOString().split("T")[0];
  const todayAppointments = (appointments.data || [])
    .filter((row) => row.appointment_date === todayKey)
    .slice(0, 6)
    .map((row) => ({
      id: row.id,
      patientName: row.patient_name || "Unknown Patient",
      appointmentTime: row.appointment_time || null,
      status: row.status || "confirmed",
      meetingLink: row.meeting_link || null,
    }));

  const recentPatientsMap = new Map();
  (appointments.data || []).forEach((row) => {
    const key = row.patient_id || row.patient_name || `apt-${row.id}`;
    const lastVisit = row.appointment_date || "";
    const name = row.patient_name || "Unknown Patient";
    const existing = recentPatientsMap.get(key) || { id: row.patient_id || null, name, lastVisit, status: row.status || "confirmed" };
    if (!existing.lastVisit || (lastVisit && lastVisit > existing.lastVisit)) {
      existing.lastVisit = lastVisit;
      existing.status = row.status || existing.status;
    }
    recentPatientsMap.set(key, existing);
  });

  const recentPatients = Array.from(recentPatientsMap.values())
    .sort((a, b) => {
      if (!a.lastVisit && !b.lastVisit) return 0;
      if (!a.lastVisit) return 1;
      if (!b.lastVisit) return -1;
      return a.lastVisit < b.lastVisit ? 1 : -1;
    })
    .slice(0, 6);

  return {
    data: {
      profile: profile.data,
      stats: analytics.data,
      todayAppointments,
      recentPatients,
    },
    error: null,
  };
};

const getDoctorConsultations = async (doctorId) => {
  const appointments = await getDoctorAppointments(doctorId);
  if (appointments.error) return appointments;

  const consultations = (appointments.data || []).filter((row) => !!row.meeting_link);
  return { data: consultations, error: null };
};

const savePrescription = async (prescriptionData) => {
  const { data, error } = await supabase.from("prescriptions").insert([prescriptionData]).select();
  return { data, error };
};

const getPrescriptionById = async (prescriptionId) => {
  return supabase
    .from("prescriptions")
    .select(
      `
      *,
      doctor:doctor_id ( id, firstName, lastName ),
      patient:patient_id ( id, firstName, lastName )
    `
    )
    .eq("id", prescriptionId)
    .single();
};

const updatePrescriptionWithAnalysis = async (prescriptionId, analysisData) => {
  const { data, error } = await supabase
    .from("prescriptions")
    .update({ ai_analysis: analysisData })
    .eq("id", prescriptionId)
    .select();

  return { data, error };
};

export {
  generateMeetingLink,
  saveMeetingLink,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorAnalytics,
  getDoctorDashboardSummary,
  getDoctorAppointments,
  createDoctorAppointment,
  updateDoctorAppointmentStatus,
  getDoctorPatients,
  getDoctorRecords,
  getDoctorConsultations,
  addPatientForDoctor,
  savePrescription,
  getPrescriptionById,
  updatePrescriptionWithAnalysis,
};
