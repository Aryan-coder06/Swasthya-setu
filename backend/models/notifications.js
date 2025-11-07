import supabase from "../main_server.js";

const NOTIFICATIONS_TABLE = "notifications";

export const createNotification = async ({
  recipientId,
  recipientRole,
  title,
  message,
  data,
}) => {
  const payload = {
    recipient_id: recipientId,
    recipient_role: recipientRole,
    title,
    message,
    data: data ?? {},
  };

  const { data: inserted, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .insert([payload])
    .select()
    .single();

  return { data: inserted, error };
};

export const createNotificationBatch = async (notifications = []) => {
  if (!notifications.length) return { data: [], error: null };

  const payload = notifications.map((notification) => ({
    recipient_id: notification.recipientId,
    recipient_role: notification.recipientRole,
    title: notification.title,
    message: notification.message,
    data: notification.data ?? {},
  }));

  const { data, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .insert(payload)
    .select();

  return { data, error };
};

export const listNotifications = async ({
  recipientId,
  recipientRole,
  status,
  limit = 25,
}) => {
  let query = supabase
    .from(NOTIFICATIONS_TABLE)
    .select("*")
    .eq("recipient_id", recipientId)
    .eq("recipient_role", recipientRole)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  return { data: data ?? [], error };
};

export const markNotificationRead = async (notificationId) => {
  const { data, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select()
    .single();

  return { data, error };
};

export const markAllNotificationsRead = async ({ recipientId, recipientRole }) => {
  const { error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .update({ status: "read", read_at: new Date().toISOString() })
    .eq("recipient_id", recipientId)
    .eq("recipient_role", recipientRole)
    .eq("status", "unread");

  return { error };
};

export const dismissNotification = async (notificationId) => {
  const { data, error } = await supabase
    .from(NOTIFICATIONS_TABLE)
    .update({ status: "dismissed", read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .select()
    .single();

  return { data, error };
};
