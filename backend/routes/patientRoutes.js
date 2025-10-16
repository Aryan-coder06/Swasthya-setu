// backend/routes/patientRoutes.js

import express from "express";
import { 
    addPatientProfile, 
    getPatientProfile, 
    updatePatientProfile 
} from "../controllers/patientController.js";

const router = express.Router();

// Route to add a new patient profile (used during signup)
router.post("/add_profile", addPatientProfile);

// Route to fetch a patient's profile
router.post("/get_profile", getPatientProfile);

// Route to update a patient's profile
router.post("/update_profile", updatePatientProfile);

export default router;