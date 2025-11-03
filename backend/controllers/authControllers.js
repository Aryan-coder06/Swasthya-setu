// controllers/authControllers
import supabase from "../main_server.js";
import { add_patient_profile } from "../models/patient.js";
import { add_doctor_profile, resolveHospitalDetails } from "../models/doctor.js";
import { add_receptionist_profile } from "../models/receptionist.js";

const signupPatient = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      gender = null,
      age = null,
      phone_no = null,
    } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.log(error);
      return res.json({
        status: error.status,
        code: error.code,
        reason: error.reason || error.message || "none",
      });
    }

    const result = await add_patient_profile(
      data.user.id,
      firstName,
      lastName,
      email,
      gender,
      phone_no,
      age
    );
    if (result?.startsWith?.("Error")) {
      return res.status(400).json({ error: result });
    }

    return res.json({
      message: "Signup Successful",
      user: {
        id: data.user.id,
        email: data.user.email,
        phone_no: data.user.phone || null,
      },
      session: data.session
        ? {
          access_token: data.session.access_token,
          expires_in: data.session.expires_in,
          refresh_token: data.session.refresh_token,
        }
        : null,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const signupDoctor = async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      gender = null,
      age = null,
      spec = null,
      hospitalId,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    if (!hospitalId) {
      return res.status(400).json({ error: "hospitalId is required" });
    }

    let authUser = null;
    let authSession = null;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      const code = error.code || error.message;
      if (code === "user_already_exists" || error.message?.toLowerCase().includes("already registered")) {
        // Try signing in with provided credentials to reuse existing account
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          return res.status(400).json({
            error: signInError.message || "User already registered. Try signing in instead.",
          });
        }

        authUser = signInData.user;
        authSession = signInData.session;
      } else {
        return res.status(error.status || 500).json({
          error: error.reason || error.message || "Signup failed",
        });
      }
    } else {
      authUser = data.user;
      authSession = data.session;
    }

    if (!authUser) {
      return res.status(500).json({ error: "Unable to complete signup. Please try again." });
    }

    // Ensure the doctor profile exists (or update if already present)
    const ensureProfile = async () => {
      const { data: existingProfile, error: existingError } = await supabase
        .from("Doctor_Profile")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (existingError) {
        return { error: existingError.message };
      }

      if (existingProfile) {
        const updates = {};
        if (firstName && firstName !== existingProfile.firstName) updates.firstName = firstName;
        if (lastName && lastName !== existingProfile.lastName) updates.lastName = lastName;
        if (spec && spec !== existingProfile.specs) updates.specs = spec;
        if (gender && gender !== existingProfile.gender) updates.gender = gender;
        if (age && age !== existingProfile.age) updates.age = age;

        if (hospitalId) {
          const { hospitalId: resolvedHospitalId, hospitalName } = await resolveHospitalDetails(hospitalId);
          if (
            resolvedHospitalId &&
            (resolvedHospitalId !== existingProfile.hospital_id || hospitalName !== existingProfile.hospital_name)
          ) {
            updates.hospital_id = resolvedHospitalId;
            updates.hospital_name = hospitalName;
          }
        }

        if (Object.keys(updates).length) {
          const { data: updatedProfile, error: updateError } = await supabase
            .from("Doctor_Profile")
            .update(updates)
            .eq("id", authUser.id)
            .select()
            .single();
          if (updateError) {
            return { error: updateError.message };
          }
          return { data: updatedProfile, alreadyExists: true };
        }

        return { data: existingProfile, alreadyExists: true };
      }

      return await add_doctor_profile(
        authUser.id,
        firstName,
        lastName,
        email,
        gender,
        spec,
        age,
        hospitalId
      );
    };

    const profileResult = await ensureProfile();
    if (profileResult?.error) {
      return res.status(400).json({ error: profileResult.error });
    }

    const profileData = profileResult.data || {};

    return res.json({
      message: profileResult.alreadyExists ? "Doctor profile linked successfully." : "Signup Successful",
      user: {
        id: authUser.id,
        email: authUser.email,
        spec: profileData.specs || spec || null,
        hospitalId: profileData.hospital_id || hospitalId,
        hospitalName: profileData.hospital_name || null,
      },
      session: authSession
        ? {
          access_token: authSession.access_token,
          expires_in: authSession.expires_in,
          refresh_token: authSession.refresh_token,
        }
        : null,
    });
  } catch (error) {
    console.error("Doctor signup error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
};

const signupReceptionist = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone_no = null,
      gender = null,
      age = null,
      password,
      hospitalId,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }
    if (!hospitalId) {
      return res.status(400).json({ error: "hospitalId is required" });
    }

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      console.error("Supabase signup error:", error);
      return res.status(error.status || 500).json({
        status: error.status,
        code: error.code,
        reason: error.reason || "none",
        message: "Signup failed.",
      });
    }

    const profileResult = await add_receptionist_profile(
      data.user.id,
      firstName,
      lastName,
      email,
      gender,
      phone_no,
      age,
      hospitalId
    );

    if (profileResult.error) {
      console.error("Add receptionist profile error:", profileResult.error);
      return res
        .status(500)
        .json({ message: "Profile creation failed after successful signup." });
    }

    return res.status(201).json({
      message: "Receptionist Signup Successful",
      user: {
        id: data.user.id,
        email: data.user.email,
        role: "receptionist",
        hospitalId: profileResult?.data?.hospital_id || hospitalId,
        hospitalName: profileResult?.data?.hospital_name || null,
      },
      session: data.session
        ? {
          access_token: data.session.access_token,
          expires_in: data.session.expires_in,
          refresh_token: data.session.refresh_token,
        }
        : null,
    });
  } catch (error) {
    console.error("General server error:", error);
    return res.status(500).json({ message: "An unexpected error occurred." });
  }
};

const signinPatient = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(400).json({ error: error.message });

    const { data: patientData, error: profileError } = await supabase
      .from("Patient_Profile")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError)
      return res.status(400).json({ error: "No patient profile found." });

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
    const { email, password, hospitalId } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    if (!hospitalId) {
      return res.status(400).json({ error: "hospitalId is required" });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(400).json({ error: error.message });

    const { data: doctorData, error: profileError } = await supabase
      .from("Doctor_Profile")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError)
      return res.status(400).json({ error: "No doctor profile found." });
    if (!doctorData.hospital_id) {
      return res.status(400).json({ error: "Doctor profile is not linked to a hospital." });
    }
    if (doctorData.hospital_id !== hospitalId) {
      return res.status(403).json({ error: "Hospital selection does not match assigned hospital." });
    }

    return res.json({
      message: "Doctor Signin Successful",
      role: "doctor",
      user: {
        ...doctorData,
        hospitalId: doctorData.hospital_id,
        hospitalName: doctorData.hospital_name,
      },
      session: data.session,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const signinReceptionist = async (req, res) => {
  try {
    const { email, password, hospitalId } = req.body;
    if (!email || !password || !hospitalId)
      return res.status(400).json({ error: "Email, password, and hospitalId are required" });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(400).json({ error: error.message });

    const { data: receptionistData, error: profileError } = await supabase
      .from("receptionist_profile")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError)
      return res.status(400).json({ error: "No receptionist profile found." });
    if (!receptionistData.hospital_id) {
      return res.status(400).json({ error: "Receptionist profile is not linked to a hospital." });
    }
    if (receptionistData.hospital_id !== hospitalId) {
      return res.status(403).json({ error: "Hospital selection does not match assigned hospital." });
    }

    return res.json({
      message: "Receptionist Signin Successful",
      role: "receptionist",
      user: {
        ...receptionistData,
        hospitalId: receptionistData.hospital_id,
        hospitalName: receptionistData.hospital_name,
      },
      session: data.session,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const patient = await supabase
      .from("Patient_Profile")
      .select("id")
      .eq("email", email)
      .single();
    const doctor = await supabase
      .from("Doctor_Profile")
      .select("id")
      .eq("email", email)
      .single();
    const receptionist = await supabase
      .from("receptionist_profile")
      .select("id")
      .eq("email", email)
      .single();

    if (!patient.data && !doctor.data && !receptionist.data) {
      return res
        .status(404)
        .json({ error: "Email not found in any user role" });
    }

    const redirectUrl = "http://localhost:3000/auth/reset-password";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      console.error("Supabase resetPasswordForEmail error:", error);
      return res
        .status(500)
        .json({ error: error.message || "Error sending recovery email" });
    }

    return res.json({
      message: "Password reset email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Forgot password server error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Error sending recovery email" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { access_token, refresh_token, new_password } = req.body;
    if (!access_token || !new_password) {
      return res.status(400).json({ error: "Access token and new password are required" });
    }

    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    } else {
      await supabase.auth.setSession({ access_token }); 
    }

    const { data, error } = await supabase.auth.updateUser({ password: new_password });

    if (error) {
      console.log(error);
      return res.status(400).json({ error: error.message || error });
    }

    return res.json({ message: "Password has been reset successfully." });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message || err });
  }
};


export {
  signupPatient,
  signupDoctor,
  signupReceptionist,
  signinPatient,
  signinDoctor,
  signinReceptionist,
  forgotPassword,
  resetPassword,
};
