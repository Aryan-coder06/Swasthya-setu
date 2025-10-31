import supabase from "../main_server.js";

const add_patient_profile = async (uid, firstName, lastName, email, gender, phone_no, age) => {
    const {error: insertError} = await supabase
        .from("Patient_Profile")
        .insert([
            {
                id: uid,
                firstName,
                lastName,
                email,
                gender,
                phone_no,
                age
            }
        ]);

        if(insertError){
            console.log("Profile Insert error: ", insertError);
            return "Error creating patient profile!";
        }
        else{
            console.log("Profile created successfully!");
        }

        return "Patient Profile created Successfully";
}

const get_patient_profile = async (uid) => {
    return await supabase
        .from("Patient_Profile")
        .select("*")
        .eq("id", uid)
        .maybeSingle();
};

const update_patient_profile = async (uid, updatedData) => {
    return await supabase
        .from("Patient_Profile")
        .update(updatedData)
        .eq("id", uid)
        .select("*")
        .maybeSingle();
};

export { add_patient_profile, get_patient_profile, update_patient_profile };
