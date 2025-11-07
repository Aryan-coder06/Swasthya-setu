import supabase from "../main_server.js";
import {
  computeAppointmentWindow,
  DEFAULT_DURATION_MINUTES,
} from "../utils/appointmentTime.js";

const ACTIVE_APPOINTMENT_STATUSES = ["confirmed", "pending", "in-progress"];

const isUUID = (value = "") =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const resolvePatientReference = async (patientId, fallbackName) => {
  if (patientId && isUUID(patientId)) {
    const { data, error } = await supabase
      .from("Patient_Profile")
      .select("id, firstName, lastName")
      .eq("id", patientId)
      .maybeSingle();

    if (!error && data) {
      const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim() || fallbackName || null;
      return { patientId: data.id, patientName: fullName };
    }
  }

  const safeName = typeof fallbackName === "string" && fallbackName.trim().length ? fallbackName.trim() : null;
  return { patientId: null, patientName: safeName };
};

const resolveDoctorProfile = async (doctorId) => {
  if (!doctorId || !isUUID(doctorId)) {
    return { doctorId: null, doctorName: null };
  }

  const { data, error } = await supabase
    .from("Doctor_Profile")
    .select("id, firstName, lastName")
    .eq("id", doctorId)
    .maybeSingle();

  if (error || !data) {
    return { doctorId: null, doctorName: null };
  }

  const doctorName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim() || null;
  return { doctorId: data.id, doctorName };
};

const autoCompleteExpiredAppointments = async () => {
  const nowIso = new Date().toISOString();
  const { error } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .in("status", ACTIVE_APPOINTMENT_STATUSES)
    .not("end_at", "is", null)
    .lte("end_at", nowIso);

  if (error) {
    console.error("Receptionist autoComplete error:", error);
  }
};

const create_appointment = async (
  {
    patientId,
    patientName,
    doctorId,
    appointmentDate,
    appointmentTime,
    status = "confirmed",
  } = {}
) => {
  if (!doctorId || !appointmentDate || !appointmentTime) {
    return { error: "Doctor, appointment date, and time are required." };
  }

  const [{ patientId: resolvedPatientId, patientName: resolvedPatientName }, doctorProfile] =
    await Promise.all([
      resolvePatientReference(patientId, patientName),
      resolveDoctorProfile(doctorId),
    ]);

  if (!doctorProfile.doctorId) {
    return { error: "Invalid doctor reference supplied. Please refresh your doctor directory." };
  }

  const { startIso, endIso } = computeAppointmentWindow({
    appointmentDate,
    appointmentTime,
    durationMinutes: DEFAULT_DURATION_MINUTES,
  });

  if (!startIso || !endIso) {
    return { error: "Invalid appointment date or time." };
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert([{
      patient_id: resolvedPatientId,
      patient_name: resolvedPatientName,
      doctor_id: doctorProfile.doctorId,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      start_at: startIso,
      end_at: endIso,
      duration_minutes: DEFAULT_DURATION_MINUTES,
      status,
      created_at: new Date().toISOString(),
    }])
    .select();

  if (error) {
    console.error("Create appointment error:", error);
    return { error: error.message };
  }
  return { data: data[0] };
};

const get_all_appointments = async (hospitalId = null) => {
  await autoCompleteExpiredAppointments();

  let query = supabase
    .from("appointments")
    .select(`
      *,
      doctor:Doctor_Profile(id, firstName, lastName, hospital_id, hospital_name),
      patient:Patient_Profile(id, firstName, lastName)
    `)
    .order("start_at", { ascending: true })
    .order("appointment_date", { ascending: true });

  if (hospitalId) {
    query = query.eq("doctor.hospital_id", hospitalId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Get appointments error:", error);
    return { error: error.message };
  }
  return { data };
};

const update_appointment_status = async (appointmentId, status) => {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq('id', appointmentId)
    .select();

  if (error) {
    console.error("Update appointment error:", error);
    return { error: error.message };
  }
  return { data: data[0] };
};

const register_patient = async (patientData) => {
  const { firstName, lastName, email, phone_no, gender, age } = patientData;
  
  const { data, error } = await supabase
    .from("Patient_Profile")
    .insert([{
      firstName,
      lastName,
      email: email || null,
      phone_no,
      gender: gender || null,
      age: age || null,
      created_at: new Date().toISOString()
    }])
    .select();

  if (error) {
    console.error("Register patient error:", error);
    return { error: error.message };
  }
  return { data: data[0] };
};

const getDoctorIdsForHospital = async (hospitalId) => {
  const { data, error } = await supabase
    .from("Doctor_Profile")
    .select("id")
    .eq("hospital_id", hospitalId);

  if (error) {
    console.error("Fetch doctors for hospital error:", error);
    return { error: error.message, doctorIds: [] };
  }

  const doctorIds = (data ?? [])
    .map((row) => row.id)
    .filter((id) => isUUID(id));

  return { doctorIds };
};

const get_all_patients = async (hospitalId) => {
  if (!hospitalId) {
    return { error: "hospitalId is required" };
  }

  const { doctorIds, error: doctorError } = await getDoctorIdsForHospital(hospitalId);
  if (doctorError) {
    return { error: doctorError };
  }

  if (!doctorIds.length) {
    return { data: [] };
  }

  const { data, error } = await supabase
    .from("appointments")
    .select(`
      patient:Patient_Profile (
        id,
        firstName,
        lastName,
        email,
        phone_no,
        gender,
        age,
        created_at
      ),
      doctor_id
    `)
    .in("doctor_id", doctorIds)
    .not("patient_id", "is", null);

  if (error) {
    console.error("Get patients error:", error);
    return { error: error.message };
  }

  const unique = [];
  const seen = new Set();
  (data || []).forEach((row) => {
    const patient = row.patient;
    if (patient?.id && !seen.has(patient.id)) {
      seen.add(patient.id);
      unique.push(patient);
    }
  });
  return { data: unique };
};

const search_patients = async (searchTerm) => {
  const { data, error } = await supabase
    .from("Patient_Profile")
    .select('*')
    .or(`firstName.ilike.%${searchTerm}%,lastName.ilike.%${searchTerm}%,phone_no.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);

  if (error) {
    console.error("Search patients error:", error);
    return { error: error.message };
  }
  return { data };
};

const extractTicketSuffix = (ticketNumber = "") => {
  const suffix = ticketNumber.substring(1);
  const parsed = parseInt(suffix, 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const create_walkin_ticket = async (patientName) => {
  const { data: allTickets, error: ticketsError } = await supabase
    .from("walkin_tickets")
    .select("ticket_number");

  if (ticketsError) {
    console.error("Fetch walk-in tickets error:", ticketsError);
    return { error: ticketsError.message };
  }

  const issuedNumbers = (allTickets ?? [])
    .map((row) => extractTicketSuffix(row.ticket_number))
    .filter((val) => typeof val === "number");

  let nextNumber = issuedNumbers.length ? Math.max(...issuedNumbers) + 1 : 1;
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const ticketNumber = `A${String(nextNumber).padStart(2, "0")}`;
    const { data, error } = await supabase
      .from("walkin_tickets")
      .insert([{
        ticket_number: ticketNumber,
        patient_name: patientName || "Anonymous Patient",
        status: "waiting",
        created_at: new Date().toISOString(),
      }])
      .select();

    if (!error) {
      return { data: data[0] };
    }

    if (error.code === "23505") {
      nextNumber += 1;
      continue;
    }

    console.error("Create walk-in ticket error:", error);
    return { error: error.message };
  }

  return { error: "Unable to generate unique ticket number. Please try again." };
};

const get_today_walkin_tickets = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await supabase
    .from("walkin_tickets")
    .select('*')
    .gte('created_at', `${today}T00:00:00`)
    .order('ticket_number', { ascending: true });

  if (error) {
    console.error("Get walk-in tickets error:", error);
    return { error: error.message };
  }
  return { data };
};

const update_walkin_status = async (ticketId, status) => {
  const { data, error } = await supabase
    .from("walkin_tickets")
    .update({ status })
    .eq('id', ticketId)
    .select();

  if (error) {
    console.error("Update walk-in ticket error:", error);
    return { error: error.message };
  }
  return { data: data[0] };
};

const create_invoice = async (invoiceData) => {
  const { patientName, amount, services } = invoiceData;
  
  const { data: lastInvoice } = await supabase
    .from("invoices")
    .select('invoice_number')
    .order('created_at', { ascending: false })
    .limit(1);

  let nextNumber = 1;
  if (lastInvoice && lastInvoice.length > 0) {
    const lastNum = parseInt(lastInvoice[0].invoice_number.substring(3));
    nextNumber = lastNum + 1;
  }

  const invoiceNumber = `INV${String(nextNumber).padStart(3, '0')}`;

  const { data, error } = await supabase
    .from("invoices")
    .insert([{
      invoice_number: invoiceNumber,
      patient_name: patientName,
      amount: amount,
      services: services || [],
      status: 'pending',
      created_at: new Date().toISOString()
    }])
    .select();

  if (error) {
    console.error("Create invoice error:", error);
    return { error: error.message };
  }
  return { data: data[0] };
};

const get_all_invoices = async () => {
  const { data, error } = await supabase
    .from("invoices")
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Get invoices error:", error);
    return { error: error.message };
  }
  return { data };
};

const update_invoice_status = async (invoiceId, status) => {
  const { data, error } = await supabase
    .from("invoices")
    .update({ 
      status,
      paid_at: status === 'paid' ? new Date().toISOString() : null
    })
    .eq('id', invoiceId)
    .select();

  if (error) {
    console.error("Update invoice error:", error);
    return { error: error.message };
  }
  return { data: data[0] };
};

const get_bed_status = async () => {
  const { data, error } = await supabase
    .from("bed_management")
    .select('*');

  if (error) {
    console.error("Get bed status error:", error);
    return { error: error.message };
  }
  return { data };
};

const update_bed_occupancy = async (wardId, occupied) => {
  const { data, error } = await supabase
    .from("bed_management")
    .update({ occupied })
    .eq('id', wardId)
    .select();

  if (error) {
    console.error("Update bed occupancy error:", error);
    return { error: error.message };
  }
  return { data: data[0] };
};

const admit_patient = async (patientName, wardId) => {
  const { data: ward } = await supabase
    .from("bed_management")
    .select('occupied, total')
    .eq('id', wardId)
    .single();

  if (!ward || ward.occupied >= ward.total) {
    return { error: "No beds available in this ward" };
  }

  const { data, error } = await supabase
    .from("bed_management")
    .update({ occupied: ward.occupied + 1 })
    .eq('id', wardId)
    .select();

  if (error) {
    console.error("Admit patient error:", error);
    return { error: error.message };
  }

  await supabase
    .from("admissions")
    .insert([{
      patient_name: patientName,
      ward_id: wardId,
      admission_date: new Date().toISOString()
    }]);

  return { data: data[0] };
};


const get_dashboard_stats = async () => {
	const today = new Date().toISOString().split('T')[0];
	
	const { count: appointmentCount, error: apptError } = await supabase
		.from("appointments")
		.select('*', { count: 'exact', head: true }) 
		.eq('appointment_date', today);

	if (apptError) {
		console.error("Get appointments count error:", apptError);
		return { error: apptError.message };
	}

	const { count: walkinCount, error: walkinError } = await supabase
		.from("walkin_tickets")
		.select('*', { count: 'exact', head: true })
		.gte('created_at', `${today}T00:00:00`);
	
	if (walkinError) {
		console.error("Get walk-in count error:", walkinError);
		return { error: walkinError.message };
	}

	const { data: todayPayments, error: paymentsError } = await supabase
		.from("invoices")
		.select('amount')
		.eq('status', 'paid')
		.gte('paid_at', `${today}T00:00:00`);

	if (paymentsError) {
		console.error("Get today's payments error:", paymentsError);
		return { error: paymentsError.message };
	}

	const totalPayments = todayPayments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;

	const { data: beds, error: bedsError } = await supabase
		.from("bed_management")
		.select('total, occupied');

	if (bedsError) {
		console.error("Get bed status error:", bedsError);
		return { error: bedsError.message };
	}

	const availableBeds = beds?.reduce((sum, ward) => sum + (ward.total - ward.occupied), 0) || 0;
	
	const totalBeds = beds?.reduce((sum, ward) => sum + ward.total, 0) || 0;
	const occupiedBeds = beds?.reduce((sum, ward) => sum + ward.occupied, 0) || 0;


	const { count: todayAdmissions } = await supabase
		.from("admissions")
		.select('*', { count: 'exact', head: true })
		.gte('admission_date', `${today}T00:00:00`);


	return {
		data: {
			todayAppointments: appointmentCount || 0,
			todayWalkins: walkinCount || 0,
			todayPayments: totalPayments,
			availableBeds: availableBeds,
			occupiedBeds: occupiedBeds,
			totalBeds: totalBeds,
			todayAdmissions: todayAdmissions || 0 
		}
	};
};

export {
  create_appointment,
  get_all_appointments,
  update_appointment_status,
  register_patient,
  get_all_patients,
  search_patients,
  create_walkin_ticket,
  get_today_walkin_tickets,
  update_walkin_status,
  create_invoice,
  get_all_invoices,
  update_invoice_status,
  get_bed_status,
  update_bed_occupancy,
  admit_patient,
  get_dashboard_stats
};
