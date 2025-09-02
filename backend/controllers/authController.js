import supabase from "../main_server.js"
import { add_patient_profile } from "../models/patient.js";

const signupPatient=async (req, res) => {

    try {
        const {email, password, firstName, lastName, gender=null, age=null, phone_no=null}=req.body;
        console.log(email, password);
        const {data, error}=await supabase.auth.signUp({email, password});

        if(error){
            console.log(error);
            return res.json({
                status: error.status, 
                code: error.code, 
                reason: error.reason || "none"
            });
        };

        res.json({
            message: "Signup Successful",
            user: {
                id: data.user.id,
                email: data.user.email,
                phone_no: data.user.phone
            },
            session: {
                access_token: data.session.access_token,
                expires_in: data.session.expires_in,
                refresh_token: data.session.refresh_token
            }
        });

        const result= await add_patient_profile(data.user.id, firstName, lastName, email, gender, phone_no, age);
        console.log(result);


    } catch (error) {
        console.log(error);
    }
}

const signinPatient=async (req, res) => {

}

export {signinPatient, signupPatient};

