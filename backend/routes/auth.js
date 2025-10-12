// routes/auth.js
import express from "express";
import { signupPatient, signupDoctor , signupReceptionist , signinPatient , signinDoctor, signinReceptionist } from "../controllers/authControllers.js"

const router= express.Router();


router.post("/signup/patient", signupPatient);
router.post("/signup/doctor", signupDoctor);
router.post("/signup/receptionist", signupReceptionist);

router.post("/signin/patient", signinPatient);
router.post("/signin/doctor", signinDoctor);
router.post("/signin/receptionist", signinReceptionist);

export default router;