// backend/routes/patientRoutes.js

import express from "express";
import { 
    addPatientProfile, 
    getPatientProfile, 
    updatePatientProfile 
} from "../controllers/patientController.js";

const router = express.Router();

router.post("/add_profile", addPatientProfile);

router.post("/get_profile", getPatientProfile);

router.post("/update_profile", updatePatientProfile);

export default router;