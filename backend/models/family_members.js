import supabase from "../main_server.js";

const TABLE = "family_members";

const sanitizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

export const listFamilyMembers = async (patientId) => {
  if (!patientId) {
    return { data: null, error: { message: "patientId is required" } };
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  return { data: data ?? [], error };
};

export const createFamilyMember = async (payload = {}) => {
  const {
    patientId,
    fullName,
    relation,
    age,
    gender,
    bloodGroup,
    phone,
    email,
    medicalHistory,
    allergies,
    emergencyContact,
    lastCheckup,
    notes,
  } = payload;

  if (!patientId || !fullName) {
    return { data: null, error: { message: "patientId and fullName are required" } };
  }

  const insertPayload = {
    patient_id: patientId,
    full_name: fullName,
    relation: relation || null,
    age: age ?? null,
    gender: gender || null,
    blood_group: bloodGroup || null,
    phone: phone || null,
    email: email || null,
    medical_history: sanitizeArray(medicalHistory),
    allergies: sanitizeArray(allergies),
    emergency_contact: !!emergencyContact,
    last_checkup: lastCheckup || null,
    notes: notes || null,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert([insertPayload])
    .select()
    .single();

  return { data, error };
};

export const updateFamilyMember = async (id, payload = {}) => {
  if (!id) {
    return { data: null, error: { message: "id is required" } };
  }

  const updates = {};
  if (payload.fullName !== undefined) updates.full_name = payload.fullName;
  if (payload.relation !== undefined) updates.relation = payload.relation || null;
  if (payload.age !== undefined) updates.age = payload.age ?? null;
  if (payload.gender !== undefined) updates.gender = payload.gender || null;
  if (payload.bloodGroup !== undefined) updates.blood_group = payload.bloodGroup || null;
  if (payload.phone !== undefined) updates.phone = payload.phone || null;
  if (payload.email !== undefined) updates.email = payload.email || null;
  if (payload.medicalHistory !== undefined) updates.medical_history = sanitizeArray(payload.medicalHistory);
  if (payload.allergies !== undefined) updates.allergies = sanitizeArray(payload.allergies);
  if (payload.emergencyContact !== undefined) updates.emergency_contact = !!payload.emergencyContact;
  if (payload.lastCheckup !== undefined) updates.last_checkup = payload.lastCheckup || null;
  if (payload.notes !== undefined) updates.notes = payload.notes || null;

  if (!Object.keys(updates).length) {
    return { data: null, error: null };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
};

export const deleteFamilyMember = async (id) => {
  if (!id) {
    return { error: { message: "id is required" } };
  }
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  return { error };
};
