import {
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
} from "../models/doctor_models.js";
import axios from "axios";

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

const mapDoctorProfile = (record) => ({
  id: record?.id ?? null,
  firstName: record?.firstName ?? "",
  lastName: record?.lastName ?? "",
  email: record?.email ?? "",
  specialty: record?.specs ?? record?.specialty ?? "",
  gender: record?.gender ?? null,
  age: record?.age ?? null,
  phone: record?.phone_no ?? record?.phone ?? "",
  bio: record?.bio ?? "",
});

const mapAppointmentRow = (row = {}) => ({
  id: row.id,
  doctorId: row.doctor_id ?? null,
  patientId: row.patient_id ?? null,
  patientName: row.patient_name ?? "Unknown Patient",
  appointmentDate: row.appointment_date ?? null,
  appointmentTime: row.appointment_time ?? null,
  status: row.status ?? "pending",
  meetingLink: row.meeting_link ?? null,
  channel: row.meeting_link ? "Video Call" : "In-Person",
});

const createMeetingLink = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Appointment ID is required" });
    }

    const meetingLink = generateMeetingLink(id);
    const { error } = await saveMeetingLink(id, meetingLink);

    if (error) {
      console.error("Error saving meeting link:", error);
      return res
        .status(500)
        .json({ error: "Could not update appointment with meeting link." });
    }

    return res.status(200).json({ meetingLink });
  } catch (error) {
    console.error("Create meeting link error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDoctorProfileHandler = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    const { data, error } = await getDoctorProfile(doctorId);
    if (error) {
      console.error("Get doctor profile error:", error);
      return res.status(500).json({ error: "Could not fetch profile." });
    }

    if (!data) {
      return res.status(404).json({ error: "Doctor profile not found." });
    }

    return res.status(200).json(mapDoctorProfile(data));
  } catch (error) {
    console.error("Get doctor profile handler error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateDoctorProfileHandler = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    const { data, error } = await updateDoctorProfile(doctorId, req.body ?? {});
    if (error) {
      console.error("Update doctor profile error:", error);
      return res.status(500).json({ error: "Could not update profile." });
    }

    return res.status(200).json(mapDoctorProfile(data ?? { ...req.body, id: doctorId }));
  } catch (error) {
    console.error("Update doctor profile handler error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDashboardSummary = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    const { data, error } = await getDoctorDashboardSummary(doctorId);
    if (error) {
      console.error("Dashboard summary error:", error);
      return res.status(500).json({ error: "Could not load dashboard summary." });
    }

    const profile = mapDoctorProfile(data.profile);
    const stats = data.stats ?? {
      totalAppointments: 0,
      recentAppointments: 0,
      totalUniquePatients: 0,
    };

    return res.status(200).json({
      profile,
      stats,
      todayAppointments: (data.todayAppointments ?? []).map((item) => ({
        id: item.id,
        patientName: item.patientName,
        appointmentTime: item.appointmentTime,
        status: item.status,
        meetingLink: item.meetingLink,
      })),
      recentPatients: (data.recentPatients ?? []).map((patient) => ({
        id: patient.id,
        name: patient.name,
        lastVisit: patient.lastVisit,
        status: patient.status,
      })),
    });
  } catch (error) {
    console.error("Get dashboard summary handler error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAnalyticsStats = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    const { data, error } = await getDoctorAnalytics(doctorId);

    if (error) {
      console.error("Error fetching analytics:", error);
      return res.status(500).json({ error: "Could not fetch analytics data." });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Get analytics stats error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const listDoctorAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    const { data, error } = await getDoctorAppointments(doctorId);
    if (error) {
      console.error("List appointments error:", error);
      return res.status(500).json({ error: "Could not load appointments." });
    }

    return res.status(200).json((data ?? []).map(mapAppointmentRow));
  } catch (error) {
    console.error("List doctor appointments handler error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createDoctorAppointmentHandler = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { patientId, patientName, appointmentDate, appointmentTime, status, mode } = req.body ?? {};

    if (!doctorId || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ error: "Doctor ID, date, and time are required" });
    }

    const { data, error } = await createDoctorAppointment(doctorId, {
      patientId,
      patientName,
      appointmentDate,
      appointmentTime,
      status,
      mode,
    });

    if (error) {
      console.error("Create appointment error:", error);
      return res.status(500).json({ error: "Could not create appointment." });
    }

    return res.status(201).json(mapAppointmentRow(data));
  } catch (error) {
    console.error("Create doctor appointment handler error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateDoctorAppointmentHandler = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    if (!appointmentId) {
      return res.status(400).json({ error: "Appointment ID is required" });
    }

    const { data, error } = await updateDoctorAppointmentStatus(appointmentId, req.body ?? {});
    if (error) {
      console.error("Update appointment error:", error);
      return res.status(500).json({ error: "Could not update appointment." });
    }

    return res.status(200).json(mapAppointmentRow(data));
  } catch (error) {
    console.error("Update doctor appointment handler error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const listDoctorPatients = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    const { data, error } = await getDoctorPatients(doctorId);
    if (error) {
      console.error("List doctor patients error:", error);
      return res.status(500).json({ error: "Could not load patients." });
    }

    return res.status(200).json(
      (data ?? []).map((patient) => ({
        id: patient.id ?? null,
        firstName: patient.firstName ?? "",
        lastName: patient.lastName ?? "",
        fullName: patient.fullName ?? `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim(),
        gender: patient.gender ?? null,
        age: patient.age ?? null,
        email: patient.email ?? "",
        phone: patient.phone ?? "",
        lastVisit: patient.lastVisit ?? null,
        status: patient.status ?? "monitoring",
        source: patient.source ?? "appointment",
      }))
    );
  } catch (error) {
    console.error("List doctor patients handler error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createDoctorPatientHandler = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { firstName, lastName } = req.body ?? {};
    if (!doctorId || !firstName || !lastName) {
      return res
        .status(400)
        .json({ error: "Doctor ID, first name, and last name are required" });
    }

    const { data, error } = await addPatientForDoctor(doctorId, req.body ?? {});
    if (error) {
      console.error("Create doctor patient error:", error);
      return res.status(500).json({ error: "Could not create patient." });
    }

    return res.status(201).json({
      id: data?.id ?? null,
      firstName: data?.firstName ?? firstName,
      lastName: data?.lastName ?? lastName,
      email: data?.email ?? req.body.email ?? "",
      phone: data?.phone_no ?? req.body.phone ?? "",
      gender: data?.gender ?? req.body.gender ?? null,
      age: data?.age ?? req.body.age ?? null,
    });
  } catch (error) {
    console.error("Create doctor patient handler error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const listDoctorRecords = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    const { data, error } = await getDoctorRecords(doctorId);
    if (error) {
      console.error("List doctor records error:", error);
      return res.status(500).json({ error: "Could not load records." });
    }

    return res.status(200).json(data ?? []);
  } catch (error) {
    console.error("List doctor records handler error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const listDoctorConsultations = async (req, res) => {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }

    const { data, error } = await getDoctorConsultations(doctorId);
    if (error) {
      console.error("List consultations error:", error);
      return res.status(500).json({ error: "Could not load consultations." });
    }

    return res.status(200).json((data ?? []).map(mapAppointmentRow));
  } catch (error) {
    console.error("List doctor consultations handler error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const createPrescription = async (req, res) => {
  try {
    const { doctor_id, patient_id, medications } = req.body;
    if (!doctor_id || !patient_id || !medications) {
      return res
        .status(400)
        .json({ error: "Doctor ID, Patient ID, and medications are required" });
    }

    const { data, error } = await savePrescription(req.body);

    if (error) {
      console.error("Error saving prescription:", error);
      return res.status(500).json({ error: "Could not save prescription." });
    }

    return res.status(201).json({ message: "Prescription created successfully", data });
  } catch (error) {
    console.error("Create prescription error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const analyzePrescription = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: prescription, error: fetchError } = await getPrescriptionById(id);
    if (fetchError || !prescription) {
      return res.status(404).json({ error: "Prescription not found." });
    }

    const aiRequestBody = {
      doctor_name: `${prescription.doctor?.firstName ?? ""} ${prescription.doctor?.lastName ?? ""}`.trim(),
      patient_name: `${prescription.patient?.firstName ?? ""} ${prescription.patient?.lastName ?? ""}`.trim(),
      medications: prescription.medications,
      notes: prescription.notes,
    };

    const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze-structured`, aiRequestBody);
    const analysis = aiResponse.data.report;

    if (!analysis) {
      return res.status(500).json({ error: "AI service did not return a valid analysis." });
    }

    const { error: updateError } = await updatePrescriptionWithAnalysis(id, analysis);
    if (updateError) {
      console.error("Error saving AI analysis:", updateError);
    }

    return res.status(200).json(analysis);
  } catch (error) {
    console.error("Analyze prescription error:", error);
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  createMeetingLink,
  getDoctorProfileHandler,
  updateDoctorProfileHandler,
  getDashboardSummary,
  getAnalyticsStats,
  listDoctorAppointments,
  createDoctorAppointmentHandler,
  updateDoctorAppointmentHandler,
  listDoctorPatients,
  createDoctorPatientHandler,
  listDoctorRecords,
  listDoctorConsultations,
  createPrescription,
  analyzePrescription,
};
