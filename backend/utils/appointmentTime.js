const DEFAULT_DURATION_MINUTES = 15;

const pad = (value) => String(value).padStart(2, "0");

const buildIsoFromDateTime = (datePart, timePart) => {
  if (!datePart || !timePart) return null;

  // Accept both "YYYY-MM-DD" and ISO strings
  const dateOnly = datePart.split("T")[0];
  const timeOnly = timePart.split("T").pop();

  if (!dateOnly || !timeOnly) return null;

  // Ensure time contains seconds for consistent parsing
  const [hours = "00", minutes = "00", seconds = "00"] = timeOnly.split(":");
  const normalizedTime = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  const isoString = `${dateOnly}T${normalizedTime}`;
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
};

const computeAppointmentWindow = ({
  appointmentDate,
  appointmentTime,
  durationMinutes = DEFAULT_DURATION_MINUTES,
}) => {
  const startIso = buildIsoFromDateTime(appointmentDate, appointmentTime);
  if (!startIso) {
    return { startIso: null, endIso: null };
  }

  const startDate = new Date(startIso);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

  return {
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    durationMinutes,
  };
};

const windowsOverlap = (windowA, windowB) => {
  if (!windowA?.start || !windowA?.end || !windowB?.start || !windowB?.end) {
    return false;
  }
  return (
    windowA.start < windowB.end &&
    windowB.start < windowA.end
  );
};

export {
  DEFAULT_DURATION_MINUTES,
  buildIsoFromDateTime,
  computeAppointmentWindow,
  windowsOverlap,
};
