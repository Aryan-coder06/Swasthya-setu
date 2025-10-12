// controllers/authControllers
import supabase from "../main_server.js"
import { add_patient_profile } from "../models/patient.js";
import { add_doctor_profile } from "../models/doctor.js";
import { add_receptionist_profile } from "../models/receptionist.js";

const signupPatient = async (req, res) => {
	//This is to check if everything is still working!
  try {
    const { email, password, firstName, lastName, gender = null, age = null, phone_no = null } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return res.json({
        status: error.status,
        code: error.code,
        reason: error.reason || error.message || "none"
      });
    }

    const result = await add_patient_profile(data.user.id, firstName, lastName, email, gender, phone_no, age);
    if (result?.startsWith?.("Error")) {
      return res.status(400).json({ error: result });
    }

    return res.json({
      message: "Signup Successful",
      user: {
        id: data.user.id,
        email: data.user.email,
        phone_no: data.user.phone || null
      },
      session: data.session ? {
        access_token: data.session.access_token,
        expires_in: data.session.expires_in,
        refresh_token: data.session.refresh_token
      } : null
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}


const signupDoctor = async (req, res) => {
  try {
    const { email, password, firstName, lastName, gender = null, age = null, spec = null } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return res.json({
        status: error.status,
        code: error.code,
        reason: error.reason || error.message || "none"
      });
    }

    const result = await add_doctor_profile(data.user.id, firstName, lastName, email, gender, spec, age);
    if (result?.startsWith?.("Error")) {
      return res.status(400).json({ error: result });
    }
    return res.json({
      message: "Signup Successful",
      user: {
        id: data.user.id,
        email: data.user.email,
        spec: spec || null
      },
      session: data.session ? {
        access_token: data.session.access_token,
        expires_in: data.session.expires_in,
        refresh_token: data.session.refresh_token
      } : null
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

const signupReceptionist = async (req, res) =>{
  try{
    const {firstName, lastName, email, phone_no = null, gender = null, age = null, password} = req.body;

    if(!email || !password){
      return res.status(400).json({error: "email and password are required"});
    }

    const {data, error} = await supabase.auth.signUp({email, password});

    if(error){
      console.error('Supabase signup error:', error);
      return res.status(error.status || 500).json({
        status: error.status,
        code: error.code,
        reason: error.reason || "none",
        message: "Signup failed."
      });
    }

    const profileResult = await add_receptionist_profile(
      data.user.id,
      firstName,
      lastName,
      email,
      gender,
      phone_no,
      age
    );

    if(profileResult.error){
      console.error('Add receptionist profile error:', profileResult.error);
      return res.status(500).json({message: "Profile creation failed after successful signup."});
    }

    return res.status(201).json({
      message: "Receptionist Signup Successful",
      user: {
        id: data.user.id,
        email: data.user.email,
        role: 'receptionist'
      },
      session: data.session ? {
        access_token: data.session.access_token,
        expires_in: data.session.expires_in,
        refresh_token: data.session.refresh_token
      } : null
    });

  } 
  catch (error){
    console.error('General server error:', error);
    return res.status(500).json({message: "An unexpected error occurred."});
  }
};


const signinPatient = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const { data: patientData, error: profileError } = await supabase
      .from("Patient_Profile")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) return res.status(400).json({ error: "No patient profile found." });

    return res.json({
      message: "Patient Signin Successful",
      role: "patient",
      user: patientData,
      session: data.session,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const signinDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const { data: doctorData, error: profileError } = await supabase
      .from("Doctor_Profile")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) return res.status(400).json({ error: "No doctor profile found." });

    return res.json({
      message: "Doctor Signin Successful",
      role: "doctor",
      user: doctorData,
      session: data.session,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const signinReceptionist = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const { data: receptionistData, error: profileError } = await supabase
      .from("receptionist_profile")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) return res.status(400).json({ error: "No receptionist profile found." });

    return res.json({
      message: "Receptionist Signin Successful",
      role: "receptionist",
      user: receptionistData,
      session: data.session,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export {
  signupPatient,
  signupDoctor,
  signupReceptionist,
  signinPatient,
  signinDoctor,
  signinReceptionist
};