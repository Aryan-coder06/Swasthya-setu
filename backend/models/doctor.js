import supabase from "../main_server.js";

const add_doctor_profile = async (uid, firstName, lastName, email, gender, spec, age) => {
  const { error: insertError } = await supabase
    .from("Doctor_Profile")   // <-- match your DB exactly
    .insert({
      id: uid,
      firstName,              // matches your column
      lastName,               // matches your column
      email,
      specs: spec,            
      gender,
      age
    });

  if (insertError) {
    console.log("Doctor profile insert error:", insertError);
    return "Error creating doctor profile!";
  }
  return "Doctor Profile created Successfully";
};


export {add_doctor_profile};