import express from "express";
import { add_doc, fetch_doc, fetch_metadata, update_profile } from "../controllers/profileController.js";
const router = express.Router();
import multer from "multer";

const upload = multer();

// Existing document routes
router.post("/add_doc", upload.single("document"), add_doc);
router.post("/fetch_doc", fetch_doc);
router.post("/fetch_metadata", fetch_metadata);

// --- NEW ROUTE FOR PROFILE UPDATES ---
router.put("/update", update_profile);

export default router;