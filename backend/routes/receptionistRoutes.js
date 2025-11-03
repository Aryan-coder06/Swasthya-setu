import express from "express";
import {
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
} from "../controllers/receptionistController.js";

const router = express.Router();

router.get("/dashboard/stats", getDashboardStats);

router.get("/doctors/all", fetchAllDoctors);


router.post("/appointments/create", createAppointment);
router.get("/appointments/all", getAllAppointments);
router.put("/appointments/update-status", updateAppointmentStatus);

router.post("/patients/register", registerPatient);
router.get("/patients/all", getAllPatients);
router.get("/patients/search", searchPatients);

router.post("/walkin/create", createWalkinTicket);
router.get("/walkin/today", getTodayWalkinTickets);
router.put("/walkin/update-status", updateWalkinStatus);

router.post("/billing/create", createInvoice);
router.get("/billing/all", getAllInvoices);
router.put("/billing/update-status", updateInvoiceStatus);

router.get("/beds/status", getBedStatus);
router.post("/beds/admit", admitPatientToBed);

export default router;
