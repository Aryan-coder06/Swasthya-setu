import {
  createNotification,
  createNotificationBatch,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
} from "../models/notifications.js";

const getNotifications = async (req, res) => {
  try {
    const { recipientId, recipientRole, status, limit } = {
      recipientId: req.query.recipientId ?? req.body?.recipientId,
      recipientRole: req.query.recipientRole ?? req.body?.recipientRole,
      status: req.query.status ?? req.body?.status,
      limit: req.query.limit ?? req.body?.limit,
    };

    if (!recipientId || !recipientRole) {
      return res
        .status(400)
        .json({ error: "recipientId and recipientRole are required" });
    }

    const { data, error } = await listNotifications({
      recipientId,
      recipientRole,
      status,
      limit: limit ? Number(limit) : undefined,
    });

    if (error) {
      throw error;
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Notification fetch error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to load notifications",
    });
  }
};

const postNotification = async (req, res) => {
  try {
    const payload = req.body;
    if (Array.isArray(payload)) {
      const { data, error } = await createNotificationBatch(
        payload.map((item) => ({
          recipientId: item.recipientId,
          recipientRole: item.recipientRole,
          title: item.title,
          message: item.message,
          data: item.data,
        }))
      );
      if (error) throw error;
      return res.status(201).json({ data });
    }

    const { recipientId, recipientRole, title, message, data } = payload ?? {};
    if (!recipientId || !recipientRole || !title || !message) {
      return res
        .status(400)
        .json({ error: "recipientId, recipientRole, title, and message are required" });
    }

    const { data: inserted, error } = await createNotification({
      recipientId,
      recipientRole,
      title,
      message,
      data,
    });

    if (error) throw error;
    return res.status(201).json({ data: inserted });
  } catch (error) {
    console.error("Notification creation error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to create notification",
    });
  }
};

const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "notification id required" });
    const { data, error } = await markNotificationRead(id);
    if (error) throw error;
    return res.status(200).json({ data });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to mark notification read",
    });
  }
};

const markAllRead = async (req, res) => {
  try {
    const { recipientId, recipientRole } = req.body ?? {};
    if (!recipientId || !recipientRole) {
      return res
        .status(400)
        .json({ error: "recipientId and recipientRole are required" });
    }
    const { error } = await markAllNotificationsRead({
      recipientId,
      recipientRole,
    });
    if (error) throw error;
    return res.status(200).json({ message: "All notifications marked as read." });
  } catch (error) {
    console.error("Mark all notifications read error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to mark notifications as read",
    });
  }
};

const dismiss = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "notification id required" });
    const { data, error } = await dismissNotification(id);
    if (error) throw error;
    return res.status(200).json({ data });
  } catch (error) {
    console.error("Dismiss notification error:", error);
    return res.status(500).json({
      error: error?.message || "Failed to dismiss notification",
    });
  }
};

export { getNotifications, postNotification, markRead, markAllRead, dismiss };
