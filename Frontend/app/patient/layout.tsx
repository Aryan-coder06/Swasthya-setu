"use client";

import { useState, useEffect, ReactNode, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Aladin, Viaoda_Libre } from "next/font/google";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart, Bell, LogOut, Activity, Calendar, FileText,
  MapPin, Stethoscope, Users, CreditCard, AlertCircle, User, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/toaster";
import { ProfileProvider, useProfile } from "../context/ProfileContext";
import { useToast } from "@/hooks/use-toast";
import { fetchNotifications, markAllNotificationsReadApi } from "@/lib/api";
import type { NotificationRecord } from "@/lib/types";

const aladin = Aladin({ subsets: ["latin"], weight: "400" });
const viaodaLibre = Viaoda_Libre({ subsets: ["latin"], weight: "400" });

function PatientLayoutUI({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profileData, isDirty, saveProfile } = useProfile();
  const { toast } = useToast();

  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Refs for the notification dropdown and bell icon
  const notificationRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const knownNotificationIds = useRef<Set<string>>(new Set());
  const notificationsLoaded = useRef(false);

  const menuItems = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", icon: Activity, route: "/patient" },
      { id: "appointments", label: "Appointments", icon: Calendar, route: "/patient/appointments" },
      { id: "records", label: "Medical Records", icon: FileText, route: "/patient/records" },
      { id: "hospitals", label: "Find Hospitals", icon: MapPin, route: "/patient/hospitals" },
      { id: "consultations", label: "AI Consultations", icon: Stethoscope, route: "/patient/ai-consultation" },
      { id: "family", label: "Family Members", icon: Users, route: "/patient/family" },
      { id: "billing", label: "Billing & Payments", icon: CreditCard, route: "/patient/billing" },
      { id: "emergency", label: "Emergency SOS", icon: AlertCircle, route: "/patient/emergency" },
      { id: "analyze-prescription", label: "Analyze Prescription", icon: FileText, route: "/patient/analyze-prescription" }
    ],
    []
  );

  const bottomMenuItems = useMemo(
    () => [{ id: "profile", label: "Profile", icon: User, route: "/patient/profile" }],
    []
  );

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!storedUser) return;
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.id) {
        setPatientId(parsed.id);
      }
    } catch (error) {
      console.error("Failed to parse stored patient user", error);
    }
  }, []);

  useEffect(() => {
    const allItems = [...menuItems, ...bottomMenuItems];
    if (pathname === '/patient') {
      setSelectedMenu('dashboard');
      return;
    }
    const activeItem = allItems.find(item => item.route !== '/patient' && pathname.startsWith(item.route));
    if (activeItem) {
      setSelectedMenu(activeItem.id);
    }
  }, [pathname, menuItems, bottomMenuItems]);

  useEffect(() => {
    if (!patientId) return;
    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications({
          recipientId: patientId,
          recipientRole: "patient",
          limit: 25,
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
        console.error("Failed to load patient notifications", error);
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [patientId, toast]);

  // Effect to handle clicks outside the notification box
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    // Bind the event listener
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef, bellRef]);


  const handleMenuClick = (route: string) => {
    router.push(route);
  };

  const handleToggleNotifications = async () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    if (nextState && unreadCount > 0 && patientId) {
      try {
        await markAllNotificationsReadApi({
          recipientId: patientId,
          recipientRole: "patient",
        });
        setUnreadCount(0);
        setNotifications((prev) =>
          prev.map((notification) => ({
            ...notification,
            status: "read",
            read_at: notification.read_at ?? new Date().toISOString(),
          }))
        );
      } catch (error) {
        console.error("Failed to mark notifications read", error);
      }
    }
  };

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
            <Badge variant="outline" className={`${viaodaLibre.className} text-[20px]`}>Patient Portal</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative" ref={notificationRef}>
              <Button
                ref={bellRef}
                size="icon"
                variant="outline"
                className="relative"
                onClick={handleToggleNotifications}
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[1.2rem] h-5 px-1 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Button>
              {notificationsOpen && (
                <div className="absolute right-0 mt-3 w-80 rounded-xl border border-slate-200 bg-white shadow-xl z-50">
                  <div className="px-4 py-3 border-b">
                    <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                    <p className="text-xs text-slate-500">Updates about your appointments and records.</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div key={notification.id} className="px-4 py-3 border-b last:border-b-0 hover:bg-slate-50">
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
            <div onClick={() => handleMenuClick('/patient/profile')} className="cursor-pointer">
              <Avatar>
                <AvatarImage src={profileData.profilePic} />
                <AvatarFallback className="bg-blue-100 text-blue-700">
                  {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      {isDirty && (
        <motion.div initial={{ y: -80 }} animate={{ y: 0 }} className="bg-blue-600 text-white py-3 px-6 sticky top-[65px] z-20 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-3"><Save className="w-5 h-5" /><p className="font-semibold text-sm">You have unsaved changes.</p></div>
            <Button variant="secondary" size="sm" onClick={saveProfile}>Save Changes</Button>
        </motion.div>
      )}

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
                className={`flex items-center rounded-2xl border border-sky-100/80 bg-sky-50/80 px-3 py-3 text-sm font-semibold text-sky-700 shadow-inner transition-all ${
                  isCollapsed ? "justify-center px-0" : "gap-3"
                }`}
              >
                <div className="rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 p-2 text-white shadow-md shadow-sky-500/30">
                  <Heart className="h-4 w-4" />
                </div>
                {!isCollapsed && (
                  <div className="leading-tight">
                    <p className="text-xs uppercase tracking-wide text-sky-600/80">
                      Patient hub
                    </p>
                    <p className="text-sm font-semibold text-sky-700">
                      Your health roadmap
                    </p>
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
                          ? "bg-blue-50 text-blue-600 font-semibold shadow-sm shadow-sky-500/20"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          isActive ? "text-blue-600" : "text-gray-500 group-hover:text-blue-500"
                        }`}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-200 pt-4">
              {bottomMenuItems.map((item) => {
                const isActive = selectedMenu === item.id;
                return (
                  <motion.button
                    key={item.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => handleMenuClick(item.route)}
                    className={`flex w-full items-center rounded-xl px-3 py-2 transition-all ${
                      isCollapsed ? "justify-center" : "gap-3"
                    } ${
                      isActive
                        ? "bg-blue-50 text-blue-600 font-semibold shadow-sm shadow-sky-500/20"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </motion.button>
                );
              })}
              <Link href="/">
                <button
                  className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-gray-700 transition-all hover:bg-gray-100 ${
                    isCollapsed ? "justify-center" : "gap-3"
                  }`}
                >
                  <LogOut className="h-5 w-5 text-rose-500" />
                  {!isCollapsed && <span>Logout</span>}
                </button>
              </Link>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <PatientLayoutUI>{children}</PatientLayoutUI>
    </ProfileProvider>
  );
}
