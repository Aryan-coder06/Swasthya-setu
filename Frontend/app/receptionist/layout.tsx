"use client";

import { useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Aladin, Viaoda_Libre } from "next/font/google";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart,
  Bell,
  LogOut,
  Activity,
  Calendar,
  Users,
  Plus,
  CreditCard,
  Bed,
  FileText,
  UserCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { fetchNotifications, markAllNotificationsReadApi, getReceptionistAppointmentRequests } from "@/lib/api";
import type { NotificationRecord } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

const NOTIFICATION_REFRESH_MS = 60_000;
const aladin = Aladin({ subsets: ["latin"], weight: "400" });
const viaodaLibre = Viaoda_Libre({ subsets: ["latin"], weight: "400" });

export default function ReceptionistLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const { toast } = useToast();

  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [receptionistName, setReceptionistName] = useState("Receptionist");
  const [receptionistInitials, setReceptionistInitials] = useState("RC");
  const [receptionistId, setReceptionistId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const knownNotificationIds = useRef<Set<string>>(new Set());
  const notificationsLoaded = useRef(false);
  const [pendingCount, setPendingCount] = useState(0);

  const menuItems = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", icon: Activity, route: "/receptionist" },
      { id: "appointments", label: "Appointments", icon: Calendar, route: "/receptionist/appointments" },
      { id: "patients", label: "Patient Management", icon: Users, route: "/receptionist/patients" },
      { id: "walkin", label: "Walk-in Tickets", icon: Plus, route: "/receptionist/walkin" },
      { id: "billing", label: "Billing & Payments", icon: CreditCard, route: "/receptionist/billing" },
      { id: "beds", label: "Bed Management", icon: Bed, route: "/receptionist/beds" },
      { id: "reports", label: "Reports", icon: FileText, route: "/receptionist/reports" },
    ],
    []
  );

  useEffect(() => {
    if (pathname === "/receptionist") {
      setSelectedMenu("dashboard");
      return;
    }
    const activeItem = menuItems.find(
      (item) => item.route !== "/receptionist" && pathname.startsWith(item.route)
    );
    if (activeItem) {
      setSelectedMenu(activeItem.id);
    }
  }, [pathname, menuItems]);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!storedUser) return;
    try {
      const user = JSON.parse(storedUser);
      const first = typeof user?.firstName === "string" && user.firstName.trim().length
        ? user.firstName.trim()
        : (typeof user?.firstname === "string" && user.firstname.trim().length ? user.firstname.trim() : "");
      const last = typeof user?.lastName === "string" && user.lastName.trim().length
        ? user.lastName.trim()
        : (typeof user?.lastname === "string" && user.lastname.trim().length ? user.lastname.trim() : "");
      const displayName = [first, last].filter(Boolean).join(" ").trim() || user?.email || "Receptionist";
      setReceptionistName(displayName);
      const initials =
        `${(first || displayName)[0] ?? "R"}${(last || displayName.split(" ")[1] || displayName)[0] ?? "C"}`
          .toUpperCase();
      setReceptionistInitials(initials);
      if (user?.id) setReceptionistId(user.id);
      const hospital = user?.hospitalId ?? user?.hospital_id ?? null;
      if (hospital) setHospitalId(hospital);
    } catch (error) {
      console.error("Failed to parse receptionist user from storage", error);
    }
  }, []);

  useEffect(() => {
    if (!receptionistId) return;
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications({
          recipientId: receptionistId,
          recipientRole: "receptionist",
          limit: 20,
        });
        if (cancelled) return;
        setNotifications(data);
        setUnreadCount(data.filter((item) => item.status === "unread").length);
        const nextIds = new Set<string>();
        data.forEach((item) => nextIds.add(item.id));
        if (notificationsLoaded.current) {
          const newNotifications = data.filter((item) => !knownNotificationIds.current.has(item.id));
          newNotifications
            .filter((item) => item.status === "unread")
            .forEach((item) =>
              toast({
                title: item.title,
                description: item.message,
              })
            );
        } else {
          notificationsLoaded.current = true;
        }
        knownNotificationIds.current = nextIds;
      } catch (error) {
        console.error("Failed to load notifications", error);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, NOTIFICATION_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [receptionistId, toast]);

  useEffect(() => {
    if (!receptionistId) return;
    let cancelled = false;

    const loadPendingCount = async () => {
      try {
        const response = await getReceptionistAppointmentRequests({
          receptionistId,
          status: "pending",
        });
        if (cancelled) return;
        setPendingCount(response.requests.length);
      } catch (error) {
        console.error("Failed to load pending appointment requests", error);
      }
    };

    loadPendingCount();
    const interval = window.setInterval(loadPendingCount, NOTIFICATION_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [receptionistId]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!notificationsOpen) return;
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [notificationsOpen]);

  const handleMenuClick = (route: string) => {
    router.push(route);
  };

  const handleToggleNotifications = async () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    if (nextState && unreadCount > 0 && receptionistId) {
      try {
        await markAllNotificationsReadApi({
          recipientId: receptionistId,
          recipientRole: "receptionist",
        });
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, status: "read", read_at: n.read_at ?? new Date().toISOString() })));
      } catch (error) {
        console.error("Failed to mark notifications as read", error);
      }
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("session");
    }
    router.push("/");
  };

  const greeting = receptionistName ? `Good Morning, ${receptionistName.split(" ")[0]}!` : "Good Morning";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <Image
                  src="/Images/swasthya-removebg-preview.png"
                  alt="SwasthyaSetu logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <span className={`${aladin.className} text-[30px] text-gray-900`}>SwasthyaSetu</span>
            </div>
            <Badge variant="outline" className={`${viaodaLibre.className} text-[20px] bg-purple-50 text-purple-700`}>Reception Portal</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search patients..." className="pl-10 w-64" />
            </div>
            <div className="relative" ref={notificationsRef}>
              <Button size="icon" variant="outline" className="relative" onClick={handleToggleNotifications}>
                <Bell className="w-4 h-4" />
                {(unreadCount > 0 || pendingCount > 0) && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center">
                    {pendingCount > 0 && (
                      <span className="absolute inline-flex h-5 w-5 rounded-full bg-red-400 opacity-75 animate-ping" />
                    )}
                    <span className="relative min-w-[1.2rem] h-5 px-1 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                      {unreadCount > 0 ? unreadCount : pendingCount}
                    </span>
                  </span>
                )}
              </Button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-semibold text-slate-800">Notifications</p>
                    <p className="text-xs text-slate-500">Latest updates across your hospital</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-sm text-slate-500 text-center">No notifications yet.</div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="px-4 py-3 border-b last:border-b-0">
                          <p className="text-sm font-medium text-slate-800">{notification.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <Avatar>
              <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                {receptionistInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside
          className={`hidden md:block bg-white border-r border-gray-200 h-[calc(100vh-65px)] sticky top-[65px] transition-all duration-300 ease-out ${
            isCollapsed ? "w-20" : "w-64"
          }`}
          onMouseEnter={() => setIsCollapsed(false)}
          onMouseLeave={() => setIsCollapsed(true)}
        >
          <nav className="flex h-full flex-col justify-between px-4 py-6">
            <div className="space-y-3">
              <div
                className={`flex items-center rounded-2xl border border-purple-100/70 bg-purple-50/70 px-3 py-3 text-sm font-semibold text-purple-700 shadow-inner transition-all ${
                  isCollapsed ? "justify-center px-0" : "gap-3"
                }`}
              >
                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-emerald-500 p-2 text-white shadow-md shadow-purple-500/30">
                  <Heart className="h-4 w-4" />
                </div>
                {!isCollapsed && (
                  <div className="leading-tight">
                    <p className="text-xs uppercase tracking-wide text-purple-600/80">Reception desk</p>
                    <p className="text-sm font-semibold text-purple-700">Flow at a glance</p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                {menuItems.map((item) => {
                  const isActive = selectedMenu === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleMenuClick(item.route)}
                      className={`group flex w-full items-center rounded-xl px-3 py-2 text-left transition-all ${
                        isCollapsed ? "justify-center" : "gap-3"
                      } ${
                        isActive
                          ? "bg-purple-50 text-purple-600 font-semibold shadow-sm shadow-purple-500/20"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          isActive ? "text-purple-600" : "text-gray-500 group-hover:text-purple-500"
                        }`}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-200 pt-4">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleMenuClick("/receptionist/appointments")}
                className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-gray-700 transition-all hover:bg-gray-100 ${
                  isCollapsed ? "justify-center" : "gap-3"
                } hidden`}
              >
                <Calendar className="h-5 w-5" />
                {!isCollapsed && <span>Appointments</span>}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleMenuClick("/receptionist/profile")}
                className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-gray-700 transition-all hover:bg-gray-100 ${
                  isCollapsed ? "justify-center" : "gap-3"
                }`}
              >
                <UserCircle className="h-5 w-5" />
                {!isCollapsed && <span>My Profile</span>}
              </motion.button>
              <button
                onClick={handleLogout}
                className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-gray-700 transition-all hover:bg-gray-100 ${
                  isCollapsed ? "justify-center" : "gap-3"
                }`}
              >
                <LogOut className="h-5 w-5 text-rose-500" />
                {!isCollapsed && <span>Logout</span>}
              </button>
            </div>
          </nav>
        </aside>
        <main className="flex-1 p-6 bg-gray-50" data-hospital-id={hospitalId ?? undefined} data-receptionist-id={receptionistId ?? undefined}>
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">{greeting}</h2>
            {hospitalId && (
              <p className="text-sm text-slate-500">Managing operations for your assigned hospital.</p>
            )}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
