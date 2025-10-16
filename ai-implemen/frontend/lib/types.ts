export type AnalysisStatus = "success" | "error";

export type RiskColor = "red" | "yellow" | "green";

export interface Medication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;   
}

export interface PrescriptionData {
  hospital_name?: string | null;
  doctor_name?: string | null;
  patient_name?: string | null;
  patient_id?: string | null;
  date_issued?: string | null;

  vitals?: Record<string, string> | null;     
  diseases_diagnoses: string[];               
  medications: Medication[];                  
  treatment_notes?: string | null;
  precautions?: string | null;

  raw_lines?: string[];                       
}

export interface ReportSection {
  title: string;
  color: RiskColor;
  items: string[]; 
}

export interface PatientReport {
  summary_header: string;
  report_sections: ReportSection[];           // sections with color

  // optional mirrors the LLM may include
  patient_name?: string | null;
  doctor_name?: string | null;
  date_issued?: string | null;

  // always present
  raw_extracted_data: PrescriptionData;
}

/** API contracts */
export interface AnalysisResponse {
  status: AnalysisStatus;          // 'success' | 'error'
  message: string;                 // human-readable
  report?: PatientReport | null;   // on success
}

export interface ImageAnalysisRequest {
  base64_image: string;
}
