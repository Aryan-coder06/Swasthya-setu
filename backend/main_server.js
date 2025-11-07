import express from "express";
import cors from "cors";
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import patientRoutes from "./routes/patientRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import auth from "./routes/auth.js";
import profile_manager from "./routes/profile.js";
import receptionistRoutes from "./routes/receptionistRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";

app.use("/profile/docs", profile_manager);
app.use("/auth", auth);
app.use("/receptionist", receptionistRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/patient", patientRoutes);
app.use("/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.send("Hello");
});

// === SUPABASE SETUP ===
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// === EXPORT SUPABASE ===
export default supabase;  // EXPORT HERE

// === START SERVER ===
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at ${process.env.LOCAL_URL || `http://localhost:${PORT}`}`);
});
