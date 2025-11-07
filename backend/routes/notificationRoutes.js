import express from "express";
import {
  getNotifications,
  postNotification,
  markRead,
  markAllRead,
  dismiss,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", getNotifications);
router.post("/", postNotification);
router.post("/read-all", markAllRead);
router.post("/:id/read", markRead);
router.post("/:id/dismiss", dismiss);

export default router;
