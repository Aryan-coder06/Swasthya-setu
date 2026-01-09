import express from "express";
import {
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
  listDoctorDirectory,
  createPrescription,
  analyzePrescription,
  getPrescriptionsByPatientId,
} from "../controllers/doctorController.js";
import { getPrescriptionById } from "../models/doctor_models.js";

const router = express.Router();

// Meeting link management must stay above generic appointment routes to avoid conflicts
router.post("/appointments/:id/create-meeting", createMeetingLink);

router.get("/directory/list", listDoctorDirectory);

router.get("/profile/:doctorId", getDoctorProfileHandler);
router.put("/profile/:doctorId", updateDoctorProfileHandler);

router.get("/:doctorId/dashboard", getDashboardSummary);
router.get("/analytics/stats/:doctorId", getAnalyticsStats);
// router.get("/")


router.get("/:doctorId/appointments", listDoctorAppointments);
router.post("/:doctorId/appointments", createDoctorAppointmentHandler);
router.patch("/appointments/:appointmentId", updateDoctorAppointmentHandler);

router.get("/:doctorId/patients", listDoctorPatients);
router.post("/:doctorId/patients", createDoctorPatientHandler);

router.get("/:doctorId/records", listDoctorRecords);
router.get("/:doctorId/consultations", listDoctorConsultations);

router.post("/prescriptions", createPrescription);
router.post("/prescriptions/:id/analyze", analyzePrescription);
router.post("/prescriptions/:patientId", getPrescriptionsByPatientId);

export default router;
