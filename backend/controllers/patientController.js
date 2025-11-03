import {
    add_patient_profile,
    get_patient_profile,
    update_patient_profile,
    list_patient_appointments,
    book_patient_appointment,
} from "../models/patient.js";
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

const listPatientAppointmentsHandler = async (req, res) => {
    try {
        const patientId = req.body?.patientId || req.query?.patientId;

        if (!patientId) {
            return res.status(400).json({ error: "patientId is required" });
        }

        const { data, error } = await list_patient_appointments(patientId);

        if (error) {
            throw new Error(error.message || "Failed to fetch appointments");
        }

        const mapped = (data || []).map((row) => ({
            id: row.id,
            doctorId: row.doctor_id,
            doctor: row.doctor ? {
                id: row.doctor.id,
                firstName: row.doctor.firstName,
                lastName: row.doctor.lastName,
                specialty: row.doctor.specs,
                hospitalId: row.doctor.hospital_id,
                hospitalName: row.doctor.hospital_name,
            } : null,
            appointmentDate: row.appointment_date,
            appointmentTime: row.appointment_time,
            startAt: row.start_at,
            endAt: row.end_at,
            durationMinutes: row.duration_minutes ?? 15,
            status: row.status,
            meetingLink: row.meeting_link || null,
            patientName: row.patient_name || null,
        }));

        return res.status(200).json({ data: mapped });
    } catch (error) {
        console.error("Error fetching patient appointments:", error);
        return res.status(500).json({ error: error?.message || "Failed to fetch appointments." });
    }
};

const bookPatientAppointmentHandler = async (req, res) => {
    try {
        const { patientId, doctorId, appointmentDate, appointmentTime, reason } = req.body ?? {};

        if (!patientId || !doctorId || !appointmentDate || !appointmentTime) {
            return res.status(400).json({ error: "patientId, doctorId, appointmentDate, and appointmentTime are required" });
        }

        const { data, error } = await book_patient_appointment({
            patientId,
            doctorId,
            appointmentDate,
            appointmentTime,
            reason,
        });

        if (error || !data) {
            const message = error?.message || "Failed to book appointment.";
            return res.status(400).json({ error: message });
        }

        return res.status(201).json({ message: "Appointment booked successfully", data });
    } catch (error) {
        console.error("Error booking patient appointment:", error);
        return res.status(500).json({ error: error?.message || "Failed to book appointment." });
    }
};

export {
    addPatientProfile,
    getPatientProfile,
    updatePatientProfile,
    savePrescriptionReport,
    getPrescriptionReports,
    listPatientAppointmentsHandler,
    bookPatientAppointmentHandler,
};
