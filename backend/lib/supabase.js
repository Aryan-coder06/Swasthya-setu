import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const stripQuotes = (value) => {
  if (typeof value !== "string") return value;
  return value.replace(/^['"]+|['"]+$/g, "").trim();
};

const supabaseUrl = stripQuotes(process.env.SUPABASE_URL);
const serviceKey =
  stripQuotes(process.env.SUPABASE_SERVICE_ROLE_KEY) || stripQuotes(process.env.SUPABASE_SERVICE_KEY);
const anonKey = stripQuotes(process.env.SUPABASE_ANON_KEY);

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not defined in environment variables.");
}

if (!serviceKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) is not defined.");
}

if (!anonKey) {
  throw new Error("SUPABASE_ANON_KEY is not defined in environment variables.");
}

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const supabasePublic = createClient(supabaseUrl, anonKey);

export { supabaseAdmin, supabasePublic };
