import express from "express";
const router= express.Router();

import { signupPatient, signinPatient } from "../controllers/authController.js"

router.post("/signup/patient", signupPatient);
router.post("/signin/patient", signinPatient);

export default router;