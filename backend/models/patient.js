import supabase from "../main_server.js";
import {
    computeAppointmentWindow,
    DEFAULT_DURATION_MINUTES,
    windowsOverlap,
} from "../utils/appointmentTime.js";

const ACTIVE_APPOINTMENT_STATUSES = ["confirmed", "pending", "in-progress"];

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

const autoCompletePatientAppointments = async (patientId) => {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
        .from("appointments")
        .update({ status: "completed" })
        .eq("patient_id", patientId)
        .in("status", ACTIVE_APPOINTMENT_STATUSES)
        .not("end_at", "is", null)
        .lte("end_at", nowIso);

    if (error) {
        console.error("autoCompletePatientAppointments error:", error);
    }
};

const list_patient_appointments = async (patientId) => {
    await autoCompletePatientAppointments(patientId);

    const { data, error } = await supabase
        .from("appointments")
        .select(`
            *,
            doctor:doctor_id ( id, firstName, lastName, specs, hospital_id, hospital_name )
        `)
        .eq("patient_id", patientId)
        .order("start_at", { ascending: true })
        .order("appointment_date", { ascending: true });

    return { data, error };
};

const book_patient_appointment = async ({
    patientId,
    doctorId,
    appointmentDate,
    appointmentTime,
    reason,
}) => {
    const { data: patientProfile, error: patientError } = await supabase
        .from("Patient_Profile")
        .select("firstName, lastName")
        .eq("id", patientId)
        .maybeSingle();

    if (patientError) {
        return { data: null, error: patientError };
    }

    const patientName = `${patientProfile?.firstName || ""} ${patientProfile?.lastName || ""}`.trim() || "Patient";

    const { startIso, endIso } = computeAppointmentWindow({
        appointmentDate,
        appointmentTime,
        durationMinutes: DEFAULT_DURATION_MINUTES,
    });

    if (!startIso || !endIso) {
        return { data: null, error: { message: "Invalid appointment date or time supplied." } };
    }

    const { data: sameDayAppointments, error: conflictError } = await supabase
        .from("appointments")
        .select("id, start_at, end_at, status")
        .eq("doctor_id", doctorId)
        .eq("appointment_date", appointmentDate)
        .in("status", ACTIVE_APPOINTMENT_STATUSES);

    if (conflictError) {
        return { data: null, error: conflictError };
    }

    const newWindow = { start: startIso, end: endIso };

    if (
        Array.isArray(sameDayAppointments) &&
        sameDayAppointments.some((existing) => {
            if (!existing.start_at || !existing.end_at) return false;
            return windowsOverlap(newWindow, {
                start: existing.start_at,
                end: existing.end_at,
            });
        })
    ) {
        return {
            data: null,
            error: { message: "Selected slot is no longer available. Please choose another time." },
        };
    }

    const { data, error } = await supabase
        .from("appointments")
        .insert([
            {
                doctor_id: doctorId,
                patient_id: patientId,
                patient_name: patientName,
                appointment_date: appointmentDate,
                appointment_time: appointmentTime,
                start_at: startIso,
                end_at: endIso,
                duration_minutes: DEFAULT_DURATION_MINUTES,
                status: "confirmed",
                created_at: new Date().toISOString(),
            },
        ])
        .select()
        .single();

    if (error) {
        return { data: null, error };
    }

    return { data, error: null };
};

export {
    add_patient_profile,
    get_patient_profile,
    update_patient_profile,
    list_patient_appointments,
    book_patient_appointment,
};
