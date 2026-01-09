import {
  create_appointment,
  get_all_appointments,
  update_appointment_status,
  register_patient,
  get_all_patients,
  create_walkin_ticket,
  get_today_walkin_tickets,
  update_walkin_status,
  create_invoice,
  get_all_invoices,
  update_invoice_status,
  get_bed_status,
  update_bed_occupancy,
  admit_patient,
  get_dashboard_stats
} from "../models/receptionist_models.js";
import supabase from "../main_server.js";
import {
  listAppointmentRequestsForHospital,
  respondToAppointmentRequest,
} from "../models/appointment_requests.js";
import {
  get_receptionist_profile_by_id,
  update_receptionist_profile,
} from "../models/receptionist.js";

const resolveHospitalContext = async ({ hospitalId, receptionistId } = {}) => {
  if (hospitalId) {
    return { hospitalId };
  }
  if (!receptionistId) {
    return { error: "hospitalId or receptionistId is required for this action." };
  }

  const { data, error } = await supabase
    .from("receptionist_profile")
    .select("hospital_id")
    .eq("id", receptionistId)
    .maybeSingle();

  if (error || !data?.hospital_id) {
    console.error("Failed to resolve receptionist hospital:", error);
    return { error: "Receptionist profile not found or missing hospital mapping." };
  }

  return { hospitalId: data.hospital_id };
};

const extractHospitalArgs = (req) => ({
  hospitalId: req.body?.hospitalId || req.query?.hospitalId || null,
  receptionistId: req.body?.receptionistId || req.query?.receptionistId || null,
});
const getDashboardStats = async (req, res) => {
  try {
    const context = extractHospitalArgs(req);
    const { hospitalId, error: contextError } = await resolveHospitalContext(context);
    if (contextError) {
      return res.status(400).json({ error: contextError });
    }

    const { data, error } = await get_dashboard_stats(hospitalId);
    if (error) {
      return res.status(400).json({ error });
    }
    res.status(200).json(data);
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createAppointment = async (req, res) => {
  try {
    const { patientId, patientName, doctorId, date, time, status } = req.body ?? {};
    if (!doctorId || !date || !time) {
      return res.status(400).json({ error: "doctorId, date, and time are required to create an appointment." });
    }

    const context = extractHospitalArgs(req);
    const { hospitalId, error: contextError } = await resolveHospitalContext(context);
    if (contextError) {
      return res.status(400).json({ error: contextError });
    }

    const { data: doctorProfile, error: doctorLookupError } = await supabase
      .from("Doctor_Profile")
      .select("id, hospital_id")
      .eq("id", doctorId)
      .maybeSingle();

    if (doctorLookupError || !doctorProfile) {
      console.error("Doctor lookup error:", doctorLookupError);
      return res.status(404).json({ error: "Doctor not found." });
    }

    if (doctorProfile.hospital_id !== hospitalId) {
      return res.status(403).json({ error: "Doctor does not belong to your hospital." });
    }

    const { data, error } = await create_appointment({
      patientId: patientId || null,
      patientName: patientName || null,
      doctorId,
      appointmentDate: date,
      appointmentTime: time,
      status: status || "confirmed",
    });

    if (error) return res.status(400).json({ error });

    res.status(201).json({
      message: "Appointment created successfully",
      data,
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getReceptionistProfile = async (req, res) => {
  try {
    const receptionistId = req.params?.id || req.query?.id || req.body?.id;
    if (!receptionistId) {
      return res.status(400).json({ error: "receptionist id is required" });
    }

    const { data, error } = await get_receptionist_profile_by_id(receptionistId);
    if (error) {
      return res.status(404).json({ error: "Receptionist profile not found." });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Get receptionist profile error:", error);
    return res.status(500).json({ error: "Failed to load profile." });
  }
};

const updateReceptionistProfile = async (req, res) => {
  try {
    const receptionistId = req.params?.id || req.body?.id;
    if (!receptionistId) {
      return res.status(400).json({ error: "receptionist id is required" });
    }

    const { data, error } = await update_receptionist_profile(receptionistId, req.body ?? {});
    if (error) {
      return res.status(400).json({ error: error.message || "Failed to update profile." });
    }

    return res.status(200).json({ message: "Profile updated successfully.", data });
  } catch (error) {
    console.error("Update receptionist profile error:", error);
    return res.status(500).json({ error: "Failed to update profile." });
  }
};


const getAllAppointments = async (req, res) => {
  try {
    let hospitalId = req.query?.hospitalId || req.body?.hospitalId || null;
    const receptionistId = req.query?.receptionistId || req.body?.receptionistId || null;

    if (!hospitalId && receptionistId) {
      const { data: profile, error: profileError } = await supabase
        .from("receptionist_profile")
        .select("hospital_id")
        .eq("id", receptionistId)
        .maybeSingle();

      if (profileError) {
        console.error("Receptionist profile lookup failed:", profileError);
      }
      hospitalId = profile?.hospital_id ?? null;
    }

    if (!hospitalId) {
      return res.status(400).json({ error: "hospitalId is required to view appointments." });
    }

    const { data, error } = await get_all_appointments(hospitalId);

    if (error) {
      return res.status(400).json({ error });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const ALLOWED_APPOINTMENT_STATUSES = new Set(["pending", "confirmed", "completed", "cancelled"]);

const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId, status } = req.body;

    if (!appointmentId || !status) {
      return res.status(400).json({ error: "Appointment ID and status are required" });
    }

    if (!ALLOWED_APPOINTMENT_STATUSES.has(status)) {
      return res.status(400).json({ error: `Status must be one of ${Array.from(ALLOWED_APPOINTMENT_STATUSES).join(", ")}` });
    }

    const { data, error } = await update_appointment_status(appointmentId, status);

    if (error) {
      return res.status(400).json({ error });
    }

    res.status(200).json({ message: "Appointment updated successfully", data });
  } catch (error) {
    console.error("Update appointment error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const registerPatient = async (req, res) => {
  try {
    const patientData = req.body;
    
    if (!patientData.firstName || !patientData.lastName || !patientData.phone_no) {
      return res.status(400).json({ error: "First name, last name, and phone number are required" });
    }

    const { data, error } = await register_patient(patientData);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(201).json({ message: "Patient registered successfully", data });
  } catch (error) {
    console.error("Register patient error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllPatients = async (req, res) => {
  try {
    let hospitalId = req.query?.hospitalId || req.body?.hospitalId || null;
    const receptionistId = req.query?.receptionistId || req.body?.receptionistId || null;

    if (!hospitalId && receptionistId) {
      const { data: profile, error: profileError } = await supabase
        .from("receptionist_profile")
        .select("hospital_id")
        .eq("id", receptionistId)
        .maybeSingle();
      if (profileError) {
        console.error("Receptionist profile lookup failed:", profileError);
      }
      hospitalId = profile?.hospital_id ?? null;
    }

    if (!hospitalId) {
      return res.status(400).json({ error: "hospitalId is required to list patients." });
    }

    const { data, error } = await get_all_patients(hospitalId);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error("Get patients error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const searchPatients = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const context = extractHospitalArgs(req);
    const { hospitalId, error: contextError } = await resolveHospitalContext(context);
    if (contextError) {
      return res.status(400).json({ error: contextError });
    }

    const { data, error } = await get_all_patients(hospitalId, searchTerm);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error("Search patients error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createWalkinTicket = async (req, res) => {
  try {
    const { patientName } = req.body;
    const context = extractHospitalArgs(req);
    if (!context.receptionistId) {
      return res.status(400).json({ error: "receptionistId is required to create a walk-in ticket." });
    }

    const { hospitalId, error: contextError } = await resolveHospitalContext(context);
    if (contextError) {
      return res.status(400).json({ error: contextError });
    }
    
    const { data, error } = await create_walkin_ticket(patientName, hospitalId, context.receptionistId);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(201).json({ message: "Walk-in ticket created successfully", data });
  } catch (error) {
    console.error("Create walk-in ticket error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getTodayWalkinTickets = async (req, res) => {
  try {
    const context = extractHospitalArgs(req);
    const { hospitalId, error: contextError } = await resolveHospitalContext(context);
    if (contextError) {
      return res.status(400).json({ error: contextError });
    }

    const { data, error } = await get_today_walkin_tickets(hospitalId);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error("Get walk-in tickets error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateWalkinStatus = async (req, res) => {
  try {
    const { ticketId, status } = req.body;
    const context = extractHospitalArgs(req);
    const { hospitalId, error: contextError } = await resolveHospitalContext(context);
    if (contextError) {
      return res.status(400).json({ error: contextError });
    }
    
    if (!ticketId || !status) {
      return res.status(400).json({ error: "Ticket ID and status are required" });
    }

    const { data, error } = await update_walkin_status(ticketId, status, hospitalId);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(200).json({ message: "Walk-in ticket updated successfully", data });
  } catch (error) {
    console.error("Update walk-in ticket error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createInvoice = async (req, res) => {
  try {
    const invoiceData = req.body;

    const context = extractHospitalArgs(req);
    if (!context.receptionistId) {
      return res.status(400).json({ error: "receptionistId is required to create invoices." });
    }

    const { hospitalId, error: contextError } = await resolveHospitalContext(context);
    if (contextError) {
      return res.status(400).json({ error: contextError });
    }

    if (!invoiceData.patientName || !invoiceData.amount) {
      return res.status(400).json({ error: "Patient name and amount are required" });
    }

    const { data, error } = await create_invoice(invoiceData, hospitalId, context.receptionistId);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(201).json({ message: "Invoice created successfully", data });
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllInvoices = async (req, res) => {
  try {
    const context = extractHospitalArgs(req);
    const { hospitalId, error: contextError } = await resolveHospitalContext(context);
    if (contextError) {
      return res.status(400).json({ error: contextError });
    }

    const { data, error } = await get_all_invoices(hospitalId);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateInvoiceStatus = async (req, res) => {
  try {
    const { invoiceId, status } = req.body;
    const context = extractHospitalArgs(req);
    const { hospitalId, error: contextError } = await resolveHospitalContext(context);
    if (contextError) {
      return res.status(400).json({ error: contextError });
    }

    if (!invoiceId || !status) {
      return res.status(400).json({ error: "Invoice ID and status are required" });
    }

    const { data, error } = await update_invoice_status(invoiceId, status, hospitalId);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(200).json({ message: "Invoice updated successfully", data });
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getBedStatus = async (req, res) => {
  try {
    const context = extractHospitalArgs(req);
    const { hospitalId, error: contextError } = await resolveHospitalContext(context);
    if (contextError) {
      return res.status(400).json({ error: contextError });
    }

    const { data, error } = await get_bed_status(hospitalId);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error("Get bed status error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
  
const admitPatientToBed = async (req, res) => {
  try {
    const { patientName, ward } = req.body;
    const context = extractHospitalArgs(req);
    const { hospitalId, error: contextError } = await resolveHospitalContext(context);
    if (contextError) {
      return res.status(400).json({ error: contextError });
    }
    
    if (!patientName || !ward) {
      return res.status(400).json({ error: "Patient name and ward are required" });
    }

    const { data, error } = await admit_patient(patientName, ward, hospitalId);
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(200).json({ message: "Patient admitted successfully", data });
  } catch (error) {
    console.error("Admit patient error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const fetchAllDoctors = async (req, res) => {
  try {
    const hospitalId = req.query?.hospitalId || req.body?.hospitalId || null;

    let query = supabase
      .from("Doctor_Profile")
      .select("id, firstName, lastName, specs, hospital_id, hospital_name")
      .order("firstName");

    if (hospitalId) {
      query = query.eq("hospital_id", hospitalId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return res.status(400).json({ error: error.message });
    }

    res.status(200).json(data || []);
  } catch (error) {
    console.error("Fetch doctors error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const listAppointmentRequests = async (req, res) => {
  try {
    const receptionistId =
      req.query?.receptionistId || req.body?.receptionistId;
    if (!receptionistId) {
      return res
        .status(400)
        .json({ error: "receptionistId is required to fetch requests." });
    }

    const { data: profile, error: profileError } = await supabase
      .from("receptionist_profile")
      .select("id, hospital_id, hospital_name, firstname, lastname")
      .eq("id", receptionistId)
      .maybeSingle();

    if (profileError || !profile) {
      return res.status(400).json({ error: "Receptionist profile not found." });
    }

    if (!profile.hospital_id) {
      return res
        .status(400)
        .json({ error: "Receptionist is not linked to a hospital." });
    }

    const { data, error } = await listAppointmentRequestsForHospital({
      hospitalId: profile.hospital_id,
      status: req.query?.status || "pending",
    });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      data,
      hospital: {
        id: profile.hospital_id,
        name: profile.hospital_name,
      },
      receptionist: {
        id: profile.id,
        firstName: profile.firstname ?? profile.firstName ?? null,
        lastName: profile.lastname ?? profile.lastName ?? null,
      },
    });
  } catch (error) {
    console.error("List appointment requests error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to load appointment requests.",
    });
  }
};

const respondToAppointmentRequestController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      action,
      receptionistId,
      doctorId,
      appointmentDate,
      appointmentTime,
      declineReason,
      notes,
    } = req.body ?? {};

    if (!id || !action || !receptionistId) {
      return res.status(400).json({
        error:
          "request id, action, and receptionistId are required to respond to a request.",
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from("receptionist_profile")
      .select("hospital_id")
      .eq("id", receptionistId)
      .maybeSingle();

    if (profileError || !profile?.hospital_id) {
      return res.status(400).json({
        error: "Receptionist profile not found or missing hospital mapping.",
      });
    }

    const { data, error } = await respondToAppointmentRequest({
      requestId: id,
      action,
      receptionistId,
      doctorId,
      appointmentDate,
      appointmentTime,
      declineReason,
      notes,
      hospitalId: profile.hospital_id,
    });

    if (error) {
      return res.status(400).json({ error: error.message || "Failed to update request." });
    }

    return res.status(200).json({
      message:
        action === "accept"
          ? "Appointment request accepted and scheduled."
          : "Appointment request declined.",
      data,
    });
  } catch (error) {
    console.error("Respond to appointment request error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to respond to appointment request.",
    });
  }
};


export {
  getDashboardStats,
  createAppointment,
  getAllAppointments,
  updateAppointmentStatus,
  registerPatient,
  getAllPatients,
  searchPatients,
  createWalkinTicket,
  getTodayWalkinTickets,
  updateWalkinStatus,
  createInvoice,
  getAllInvoices,
  updateInvoiceStatus,
  getBedStatus,
  admitPatientToBed,
  fetchAllDoctors,
  listAppointmentRequests,
  respondToAppointmentRequestController,
  getReceptionistProfile,
  updateReceptionistProfile,
};
