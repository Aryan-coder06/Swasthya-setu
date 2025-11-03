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
    console.error("Doctor hospital lookup error:", error);
    return { hospitalId, hospitalName: null };
  }

  return {
    hospitalId: data?.id ?? hospitalId,
    hospitalName: data?.name ?? null,
  };
};

const add_doctor_profile = async (uid, firstName, lastName, email, gender, spec, age, hospitalId) => {
  const { hospitalId: resolvedHospitalId, hospitalName } = await resolveHospitalDetails(hospitalId);

  const { data, error: insertError } = await supabase
    .from("Doctor_Profile")
    .insert({
      id: uid,
      firstName,
      lastName,
      email,
      specs: spec,
      gender,
      age,
      hospital_id: resolvedHospitalId,
      hospital_name: hospitalName,
    })
    .select()
    .single();

  if (insertError) {
    console.log("Doctor profile insert error:", insertError);
    return { error: "Error creating doctor profile!" };
  }
  return { data };
};


export { add_doctor_profile, resolveHospitalDetails };
