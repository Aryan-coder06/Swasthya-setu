import {
  create_appointment,
  get_all_appointments,
  update_appointment_status,
  register_patient,
  get_all_patients,
  search_patients,
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
const getDashboardStats = async (req, res) => {
  try {
    const { data, error } = await get_dashboard_stats();
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
    const { patientId, doctorId, date, time } = req.body;

    if (!patientId || !doctorId || !date || !time) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const { data, error } = await create_appointment(patientId, doctorId, date, time);
    
    if (error) return res.status(400).json({ error });

    res.status(201).json({
      message: "Appointment created successfully",
      data
    });
  } catch (error) {
    console.error("Create appointment error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const getAllAppointments = async (req, res) => {
  try {
    const { data, error } = await get_all_appointments();
    
    if (error) {
      return res.status(400).json({ error });
    }
    
    res.status(200).json(data);
  } catch (error) {
    console.error("Get appointments error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId, status } = req.body;
    
    if (!appointmentId || !status) {
      return res.status(400).json({ error: "Appointment ID and status are required" });
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
    const { data, error } = await get_all_patients();
    
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

    const { data, error } = await search_patients(searchTerm);
    
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

    const { data, error } = await create_walkin_ticket(patientName);
    
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
    const { data, error } = await get_today_walkin_tickets();
    
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
    
    if (!ticketId || !status) {
      return res.status(400).json({ error: "Ticket ID and status are required" });
    }

    const { data, error } = await update_walkin_status(ticketId, status);
    
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
    
    if (!invoiceData.patientName || !invoiceData.amount) {
      return res.status(400).json({ error: "Patient name and amount are required" });
    }

    const { data, error } = await create_invoice(invoiceData);
    
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
    const { data, error } = await get_all_invoices();
    
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
    
    if (!invoiceId || !status) {
      return res.status(400).json({ error: "Invoice ID and status are required" });
    }

    const { data, error } = await update_invoice_status(invoiceId, status);
    
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
    const { data, error } = await get_bed_status();
    
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
    
    if (!patientName || !ward) {
      return res.status(400).json({ error: "Patient name and ward are required" });
    }

    const { data, error } = await admit_patient(patientName, ward);
    
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
    console.log("Fetching doctors from Supabase..."); 

    const { data, error } = await supabase
      .from("Doctor_Profile")
      .select("id, firstName, lastName")
      .order("firstName");

    if (error) {
      console.error("Supabase error:", error);
      return res.status(400).json({ error: error.message });
    }

    console.log("Doctors fetched:", data);
    res.status(200).json(data || []);
  } catch (error) {
    console.error("Fetch doctors error:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
  fetchAllDoctors
};