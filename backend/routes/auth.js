// routes/auth.js
import express from "express";
import {
  signupPatient,
  signupDoctor,
  signupReceptionist,
  signinPatient,
  signinDoctor,
  signinReceptionist,
  forgotPassword,
  resetPassword,
} from "../controllers/authControllers.js";
import { listHospitalsDirectory } from "../controllers/hospitalController.js";

const router = express.Router();

router.post("/signup/patient", signupPatient);
router.post("/signup/doctor", signupDoctor);
router.post("/signup/receptionist", signupReceptionist);

router.post("/signin/patient", signinPatient);
router.post("/signin/doctor", signinDoctor);
router.post("/signin/receptionist", signinReceptionist);

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/hospitals", listHospitalsDirectory);

export default router;
