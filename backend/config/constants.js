const normalizeTableName = (value, fallback) => {
  if (!value || typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
};

export const HOSPITALS_TABLE = normalizeTableName(process.env.SUPABASE_HOSPITALS_TABLE, "hospitals");

