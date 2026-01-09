// File Location: SWAS/Frontend/lib/types.ts

export type RiskColor = 'red' | 'yellow' | 'green';

export type Medication = {
    name?: string | null;
    dosage?: string | null;
    frequency?: string | null;
    duration?: string | null;
    notes?: string | null;
};

export type PrescriptionData = {
    hospital_name?: string | null;
    doctor_name?: string | null;
    patient_name?: string | null;
    patient_id?: string | null;
    date_issued?: string | null;
    vitals?: Record<string, string> | null;
    diseases_diagnoses?: string[] | null;
    treatment_notes?: string | null;
    precautions?: string | null;
    medications?: Medication[] | null;
    raw_lines?: string[] | null;
};

export type ReportSection = {
    title: string;
    items: string[];
    color: RiskColor;
};

export type PatientReport = {
    summary_header: string;
    patient_name?: string | null;
    doctor_name?: string | null;
    date_issued?: string | null;
    report_sections: ReportSection[];
    raw_extracted_data: PrescriptionData;
};

export type AnalysisResponse = {
    status: 'success' | 'error';
    message: string;
    report: PatientReport | null;
};

export type SavePrescriptionPayload = {
    patientId: string;
    report: PatientReport;
    file: File;
};

export type SavePrescriptionResponse = {
    success: boolean;
    message: string;
    recordId?: string;
    imageUrl?: string | null;
};

export type NotificationStatus = "unread" | "read" | "dismissed";

export type NotificationRecord = {
    id: string;
    recipient_id: string;
    recipient_role: "patient" | "doctor" | "receptionist";
    title: string;
    message: string;
    data?: Record<string, any>;
    status: NotificationStatus;
    created_at: string;
    read_at?: string | null;
};

export type AppointmentRequest = {
    id: string;
    patient_id: string | null;
    patient_name: string | null;
    hospital_id: string | null;
    hospital_name: string | null;
    doctor_id: string | null;
    preferred_specialty?: string | null;
    preferred_date?: string | null;
    preferred_time?: string | null;
    status: "pending" | "accepted" | "declined" | "cancelled";
    receptionist_id?: string | null;
    notes?: string | null;
    decline_reason?: string | null;
    appointment_date?: string | null;
    appointment_time?: string | null;
    appointment_id?: string | null;
    created_at: string;
    updated_at?: string | null;
    response_at?: string | null;
};

export type ReceptionistProfile = {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone_no?: string | null;
    phoneNo?: string | null;
    gender?: string | null;
    age?: number | null;
    hospital_id?: string | null;
    hospitalId?: string | null;
    hospital_name?: string | null;
    hospitalName?: string | null;
};

export type WalkInTicket = {
    id: string;
    ticket_number: string;
    patient_name: string;
    status: string;
    created_at: string;
};

export type InvoiceRecord = {
    id: string;
    invoice_number: string;
    patient_name: string;
    amount: number;
    services: string[];
    status: string;
    created_at: string;
    paid_at?: string | null;
};

export type AppointmentRecord = {
    id: string;
    patient_id?: string | null;
    patient_name?: string | null;
    doctor_id: string;
    doctor_name?: string | null;
    appointment_date: string;
    appointment_time: string;
    status: string;
};

export type DoctorSummary = {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    specs?: string | null;
    hospital_id?: string | null;
    hospital_name?: string | null;
};

export type FamilyMember = {
    id: string;
    patient_id: string;
    full_name: string;
    relation?: string | null;
    age?: number | null;
    gender?: string | null;
    blood_group?: string | null;
    phone?: string | null;
    email?: string | null;
    medical_history?: string[] | null;
    allergies?: string[] | null;
    emergency_contact?: boolean | null;
    last_checkup?: string | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
};
