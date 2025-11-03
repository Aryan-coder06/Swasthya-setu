"use client";

import { useState, useEffect, ReactNode, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart, Bell, LogOut, Activity, Calendar, FileText,
  Users, Video, ClipboardList, TrendingUp, User, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/toaster";
import { DoctorProfileProvider, useDoctorProfile } from "../context/DoctorProfileContext";

// The UI component that consumes the context
function DoctorLayoutUI({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profileData, isDirty, saveProfile } = useDoctorProfile(); 

  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(true);

  const menuItems = useMemo(
    () => [
      { id: "dashboard", label: "Dashboard", icon: Activity, route: "/doctor" },
      { id: "appointments", label: "Appointments", icon: Calendar, route: "/doctor/appointments" },
      { id: "patients", label: "My Patients", icon: Users, route: "/doctor/patients" },
      { id: "consultations", label: "Consultations", icon: Video, route: "/doctor/consultations" },
      { id: "prescriptions", label: "Prescriptions", icon: ClipboardList, route: "/doctor/prescriptions" },
      { id: "records", label: "Medical Records", icon: FileText, route: "/doctor/records" },
      { id: "analytics", label: "Analytics", icon: TrendingUp, route: "/doctor/analytics" },
    ],
    []
  );

  const bottomMenuItems = useMemo(
    () => [
      { id: "profile", label: "Profile", icon: User, route: "/doctor/profile" },
    ],
    []
  );

  // Corrected useEffect to reliably set the active menu item
  useEffect(() => {
    const allItems = [...menuItems, ...bottomMenuItems];
    if (pathname === '/doctor') {
      setSelectedMenu('dashboard');
      return;
    }
    const activeItem = allItems.find(item => item.route !== '/doctor' && pathname.startsWith(item.route));
    if (activeItem) {
      setSelectedMenu(activeItem.id);
    }
  }, [pathname, menuItems, bottomMenuItems]);

  const handleMenuClick = (route: string) => {
    router.push(route);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 healthcare-gradient rounded-lg flex items-center justify-center"><Heart className="w-5 h-5 text-white" /></div>
              <span className="text-xl font-bold text-gray-900">SwasthyaSetu</span>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700">Doctor Portal</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button size="icon" variant="outline" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
            <div onClick={() => handleMenuClick('/doctor/profile')} className="cursor-pointer">
              <Avatar>
                <AvatarImage src={profileData.profilePic} />
                <AvatarFallback className="bg-green-100 text-green-700">
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
                className={`flex items-center rounded-2xl border border-emerald-100/80 bg-emerald-50/70 px-3 py-3 text-sm font-semibold text-emerald-700 shadow-inner transition-all ${
                  isCollapsed ? "justify-center px-0" : "gap-3"
                }`}
              >
                <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 p-2 text-white shadow-md shadow-emerald-500/30">
                  <Heart className="h-4 w-4" />
                </div>
                {!isCollapsed && (
                  <div className="leading-tight">
                    <p className="text-xs uppercase tracking-wide text-emerald-600/80">
                      Doctor console
                    </p>
                    <p className="text-sm font-semibold text-emerald-700">
                      Care command center
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
                          ? "bg-emerald-50 text-emerald-600 font-semibold shadow-sm shadow-emerald-500/20"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${
                          isActive ? "text-emerald-600" : "text-gray-500 group-hover:text-emerald-500"
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
                        ? "bg-emerald-50 text-emerald-600 font-semibold shadow-sm shadow-emerald-500/20"
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

// The root layout component wraps the UI with the Context Provider
export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <DoctorProfileProvider>
      <DoctorLayoutUI>{children}</DoctorLayoutUI>
    </DoctorProfileProvider>
  );
}
