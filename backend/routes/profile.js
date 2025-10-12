import express from "express";
import { add_doc, fetch_doc, fetch_metadata } from "../controllers/profileController.js";
const router = express.Router();
import multer from "multer";

const upload = multer();

router.post("/add_doc", upload.single("document"), add_doc);
router.post("/fetch_doc", fetch_doc);
router.post("/fetch_metadata", fetch_metadata);

export default router;
