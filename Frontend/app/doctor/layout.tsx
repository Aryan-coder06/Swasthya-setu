"use client";

import { useState, useEffect, ReactNode } from "react";
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

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity, route: "/doctor" },
    { id: "appointments", label: "Appointments", icon: Calendar, route: "/doctor/appointments" },
    { id: "patients", label: "My Patients", icon: Users, route: "/doctor/patients" },
    { id: "consultations", label: "Consultations", icon: Video, route: "/doctor/consultations" },
    { id: "prescriptions", label: "Prescriptions", icon: ClipboardList, route: "/doctor/prescriptions" },
    { id: "records", label: "Medical Records", icon: FileText, route: "/doctor/records" },
    { id: "analytics", label: "Analytics", icon: TrendingUp, route: "/doctor/analytics" }
  ];
  
  const bottomMenuItems = [
    { id: "profile", label: "Profile", icon: User, route: "/doctor/profile" },
  ];

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
  }, [pathname]);

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
        <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-65px)] sticky top-[65px]">
          <nav className="p-4 h-full flex flex-col justify-between">
            <div className="space-y-2">
              {menuItems.map((item) => (<motion.button key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleMenuClick(item.route)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${selectedMenu === item.id ? "bg-green-50 text-green-600 font-semibold" : "text-gray-700 hover:bg-gray-100"}`}><item.icon className="w-5 h-5" /><span>{item.label}</span></motion.button>))}
            </div>
            <div>
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {bottomMenuItems.map((item) => (<motion.button key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleMenuClick(item.route)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${selectedMenu === item.id ? "bg-green-50 text-green-600 font-semibold" : "text-gray-700 hover:bg-gray-100"}`}><item.icon className="w-5 h-5" /><span>{item.label}</span></motion.button>))}
                <Link href="/"><button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100"><LogOut className="w-5 h-5" /><span>Logout</span></button></Link>
              </div>
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


