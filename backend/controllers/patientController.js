// backend/controllers/patientController.js

import { add_patient_profile, get_patient_profile, update_patient_profile } from "../models/patient.js";

// Controller to add a new patient profile
const addPatientProfile = async (req, res) => {
    try {
        const { uid, firstName, lastName, email, gender, phone_no, age } = req.body;
        const result = await add_patient_profile(uid, firstName, lastName, email, gender, phone_no, age);
        res.status(200).json({ message: result });
    } catch (error) {
        console.error("Error in addPatientProfile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Controller to get a patient's profile by uid
const getPatientProfile = async (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const { data, error } = await get_patient_profile(uid);
        if (error) {
            return res.status(404).json({ error: "Patient profile not found" });
        }
        res.status(200).json(data);
    } catch (error) {
        console.error("Error in getPatientProfile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

// Controller to update a patient's profile
const updatePatientProfile = async (req, res) => {
    try {
        const { uid, updatedData } = req.body;
        if (!uid || !updatedData) {
            return res.status(400).json({ error: "User ID and updated data are required" });
        }
        const { data, error } = await update_patient_profile(uid, updatedData);
        if (error) {
            return res.status(500).json({ error: "Failed to update profile" });
        }
        res.status(200).json({ message: "Profile updated successfully!", data });
    } catch (error) {
        console.error("Error in updatePatientProfile:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export { addPatientProfile, getPatientProfile, updatePatientProfile };