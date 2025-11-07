import supabase from "../main_server.js";
import { HOSPITALS_TABLE } from "../config/constants.js";

const resolveHospitalDetails = async (hospitalId) => {
  if (!hospitalId) return { hospitalId: null, hospitalName: null };

  const { data, error } = await supabase
    .from(HOSPITALS_TABLE)
    .select("id, name")
    .eq("id", hospitalId)
    .maybeSingle();

  if (error) {
    console.error("Receptionist hospital lookup error:", error);
    return { hospitalId, hospitalName: null };
  }

  return {
    hospitalId: data?.id ?? hospitalId,
    hospitalName: data?.name ?? null,
  };
};

const TABLE_NAME = "receptionist_profile";

const normaliseReceptionistPayload = (payload = {}) => {
  const result = {};
  if (payload.firstName !== undefined) result.firstname = payload.firstName;
  if (payload.lastName !== undefined) result.lastname = payload.lastName;
  if (payload.email !== undefined) result.email = payload.email;
  if (payload.gender !== undefined) result.gender = payload.gender;
  if (payload.phone_no !== undefined) result.phone_no = payload.phone_no;
  if (payload.phoneNo !== undefined) result.phone_no = payload.phoneNo;
  if (payload.age !== undefined) result.age = payload.age;
  return result;
};

const shapeReceptionistResponse = (record = {}) => {
  if (!record) return record;
  return {
    ...record,
    firstName: record.firstName ?? record.firstname ?? null,
    lastName: record.lastName ?? record.lastname ?? null,
    phone_no: record.phone_no ?? null,
    hospitalId: record.hospitalId ?? record.hospital_id ?? null,
    hospitalName: record.hospitalName ?? record.hospital_name ?? null,
  };
};

const add_receptionist_profile = async (uid, firstname, lastname, email, gender, phone_no, age, hospitalId) => {
  const { hospitalId: resolvedHospitalId, hospitalName } = await resolveHospitalDetails(hospitalId);

  const { data, error: insertError } = await supabase
    .from(TABLE_NAME)
    .insert([
      {
        id: uid,
        firstname,
        lastname,
        email,
        gender,
        phone_no,
        age,
        hospital_id: resolvedHospitalId,
        hospital_name: hospitalName,
      },
    ])
    .select()
    .single();

  if (insertError) {
    console.error("Profile Insert error:", insertError);
    return { error: "Error creating receptionist profile!" };
  }

  return { data: shapeReceptionistResponse(data) };
};

const get_receptionist_profile_by_id = async (id) => {
  if (!id) {
    return { data: null, error: new Error("Receptionist id is required") };
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select("id, firstname, lastname, email, gender, phone_no, age, hospital_id, hospital_name")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Fetch receptionist profile error:", error);
    return { data: null, error };
  }

  return { data: shapeReceptionistResponse(data), error: null };
};

const update_receptionist_profile = async (id, updates = {}) => {
  if (!id) {
    return { data: null, error: new Error("Receptionist id is required") };
  }

  const payload = normaliseReceptionistPayload(updates);

  let resolvedHospital = null;
  if (updates.hospitalId || updates.hospital_id) {
    resolvedHospital = await resolveHospitalDetails(updates.hospitalId ?? updates.hospital_id);
    payload.hospital_id = resolvedHospital.hospitalId;
    payload.hospital_name = resolvedHospital.hospitalName;
  }

  if (!Object.keys(payload).length) {
    // Nothing to update, return current record
    return await get_receptionist_profile_by_id(id);
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(payload)
    .eq("id", id)
    .select("id, firstname, lastname, email, gender, phone_no, age, hospital_id, hospital_name")
    .maybeSingle();

  if (error) {
    console.error("Update receptionist profile error:", error);
    return { data: null, error };
  }

  return { data: shapeReceptionistResponse(data), error: null };
};

export {
  add_receptionist_profile,
  get_receptionist_profile_by_id,
  update_receptionist_profile,
};
