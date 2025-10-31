
import { add_patient_profile, get_patient_profile, update_patient_profile } from "../models/patient.js";
import { createPrescriptionReport, listPrescriptionReports } from "../models/prescriptions.js";

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

const savePrescriptionReport = async (req, res) => {
    try {
        const { patientId, report } = req.body;
        const file = req.file;

        if (!patientId) {
            return res.status(400).json({ error: "patientId is required" });
        }

        if (!report) {
            return res.status(400).json({ error: "report payload is required" });
        }

        if (!file) {
            return res.status(400).json({ error: "Prescription image is required" });
        }

        let parsedReport = report;
        if (typeof report === "string") {
            try {
                parsedReport = JSON.parse(report);
            } catch (error) {
                return res.status(400).json({ error: "Invalid report JSON payload" });
            }
        }

        const savedRecord = await createPrescriptionReport({
            patientId,
            report: parsedReport,
            file,
        });

        return res.status(201).json({
            message: "Prescription report saved successfully.",
            data: savedRecord,
        });
    } catch (error) {
        console.error("Error saving prescription report:", error);
        return res.status(500).json({
            error: error?.message || "Failed to save prescription report.",
        });
    }
};

const getPrescriptionReports = async (req, res) => {
    try {
        const patientId = req.body?.patientId || req.query?.patientId;

        if (!patientId) {
            return res.status(400).json({ error: "patientId is required" });
        }

        const { data, error } = await listPrescriptionReports(patientId);

        if (error) {
            throw new Error(error.message || "Failed to fetch prescription reports");
        }

        return res.status(200).json({ data });
    } catch (error) {
        console.error("Error fetching prescription reports:", error);
        return res.status(500).json({
            error: error?.message || "Failed to fetch prescription reports.",
        });
    }
};

export { addPatientProfile, getPatientProfile, updatePatientProfile, savePrescriptionReport, getPrescriptionReports };
