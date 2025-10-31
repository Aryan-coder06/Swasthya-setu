import { randomUUID } from "crypto";
import { supabaseAdmin } from "../lib/supabase.js";

const PRESCRIPTION_BUCKET = process.env.SUPABASE_PRESCRIPTION_BUCKET || "prescriptions";
const REPORT_TABLE = process.env.SUPABASE_PRESCRIPTION_TABLE || "Prescription_Reports";

const inferFileExtension = (file) => {
  if (!file?.mimetype) return "png";
  const [, subtype] = file.mimetype.split("/");
  if (subtype) {
    if (subtype === "jpeg") return "jpg";
    return subtype;
  }
  return "png";
};

const uploadPrescriptionImage = async (patientId, recordId, file) => {
  if (!file) return null;

  const extension = inferFileExtension(file);
  const objectPath = `${patientId}/${recordId}.${extension}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(PRESCRIPTION_BUCKET)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype || "image/png",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Failed to upload prescription image.");
  }

  const { data: publicUrlData, error: urlError } = supabaseAdmin.storage
    .from(PRESCRIPTION_BUCKET)
    .getPublicUrl(objectPath);

  if (urlError) {
    throw new Error(urlError.message || "Unable to resolve prescription image URL.");
  }

  return publicUrlData?.publicUrl || null;
};

export const createPrescriptionReport = async ({ patientId, report, file }) => {
  if (!patientId) {
    throw new Error("Patient identifier is required.");
  }
  if (!report) {
    throw new Error("Report payload is required.");
  }

  const recordId = randomUUID();
  const sanitizedReport = JSON.parse(JSON.stringify(report));

  const imageUrl = await uploadPrescriptionImage(patientId, recordId, file);

  const payload = {
    id: recordId,
    patient_id: patientId,
    summary_header: sanitizedReport.summary_header || null,
    doctor_name:
      sanitizedReport.doctor_name || sanitizedReport.raw_extracted_data?.doctor_name || null,
    patient_name:
      sanitizedReport.patient_name || sanitizedReport.raw_extracted_data?.patient_name || null,
    date_issued:
      sanitizedReport.date_issued || sanitizedReport.raw_extracted_data?.date_issued || null,
    report: sanitizedReport,
    raw_extracted_data: sanitizedReport.raw_extracted_data || null,
    image_url: imageUrl,
  };

  const { data, error } = await supabaseAdmin
    .from(REPORT_TABLE)
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Failed to save prescription report.");
  }

  return data;
};

export const listPrescriptionReports = async (patientId) => {
  let query = supabaseAdmin.from(REPORT_TABLE).select("*").order("created_at", { ascending: false });

  if (patientId) {
    query = query.eq("patient_id", patientId);
  }

  return await query;
};
