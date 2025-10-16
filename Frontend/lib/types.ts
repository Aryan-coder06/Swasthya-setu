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