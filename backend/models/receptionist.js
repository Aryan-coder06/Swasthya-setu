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

const add_receptionist_profile = async (uid, firstname, lastname, email, gender, phone_no, age, hospitalId) => {
  const { hospitalId: resolvedHospitalId, hospitalName } = await resolveHospitalDetails(hospitalId);

  const { data, error: insertError } = await supabase
    .from("receptionist_profile")
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

  console.log("Receptionist profile created successfully!");
  return { data };
};

export { add_receptionist_profile };
