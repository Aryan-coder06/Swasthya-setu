// backend/routes/patientRoutes.js

import express from "express";
import multer from "multer";
import {
  addPatientProfile,
  getPatientProfile,
  updatePatientProfile,
  savePrescriptionReport,
  getPrescriptionReports,
  listPatientAppointmentsHandler,
  bookPatientAppointmentHandler,
} from "../controllers/patientController.js";
import { getNearbyHospitals } from "../controllers/hospitalController.js";

const router = express.Router();
const upload = multer();

router.post("/add_profile", addPatientProfile);

router.post("/get_profile", getPatientProfile);

router.post("/update_profile", updatePatientProfile);

router.post("/prescriptions/save", upload.single("file"), savePrescriptionReport);
router.post("/prescriptions/list", getPrescriptionReports);
router.post("/hospitals/nearby", getNearbyHospitals);
router.post("/appointments/list", listPatientAppointmentsHandler);
router.post("/appointments/book", bookPatientAppointmentHandler);

export default router;
