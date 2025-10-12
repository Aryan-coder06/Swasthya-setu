import supabase from "../main_server.js";

const add_receptionist_profile = async (uid, firstname, lastname, email, gender, phone_no, age) => {
  const {error: insertError} = await supabase
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
      }
    ]);

  if(insertError){
    console.error("Profile Insert error:", insertError);
    return {error: "Error creating receptionist profile!"};
  } 
  else{
    console.log("Receptionist profile created successfully!");
    return {message: "Receptionist Profile created Successfully"};
  }
};

export {add_receptionist_profile};