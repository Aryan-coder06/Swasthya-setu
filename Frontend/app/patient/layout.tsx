"use client";

import { useState, useEffect, ReactNode, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
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

function PatientLayoutUI({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profileData, isDirty, saveProfile } = useProfile();

  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Refs for the notification dropdown and bell icon
  const notificationRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: Activity, route: "/patient" },
  { id: "appointments", label: "Appointments", icon: Calendar, route: "/patient/appointments" },
  { id: "records", label: "Medical Records", icon: FileText, route: "/patient/records" },
  { id: "hospitals", label: "Find Hospitals", icon: MapPin, route: "/patient/hospitals" },
  { id: "consultations", label: "AI Consultations", icon: Stethoscope, route: "/patient/ai-consultation" },
  { id: "family", label: "Family Members", icon: Users, route: "/patient/family" },
  { id: "billing", label: "Billing", icon: CreditCard, route: "/patient/billing" },
  { id: "emergency", label: "Emergency SOS", icon: AlertCircle, route: "/patient/emergency" },
  { id: "analyze-prescription", label: "Analyze Prescription", icon: FileText, route: "/patient/analyze-prescription" } // added here
];

  const bottomMenuItems = [
    { id: "profile", label: "Profile", icon: User, route: "/patient/profile" }
  ];

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
  }, [pathname]);

  // Effect to handle clicks outside the notification box
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 healthcare-gradient rounded-lg flex items-center justify-center"><Heart className="w-5 h-5 text-white" /></div>
              <span className="text-xl font-bold text-gray-900">SwasthyaSetu</span>
            </div>
            <Badge variant="outline">Patient Portal</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <Button ref={bellRef} size="icon" variant="outline" className="relative" onClick={() => setShowNotifications(!showNotifications)}>
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
            {showNotifications && (
              <div ref={notificationRef} className="absolute top-16 right-6 w-80 bg-white border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b"><h3 className="font-semibold">Notifications</h3></div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-3 border-b hover:bg-gray-50">
                    <p className="text-sm">Appointment confirmed with Dr. Sarah Wilson</p>
                    <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                  </div>
                   <div className="p-3 border-b hover:bg-gray-50">
                    <p className="text-sm">Lab results are ready for download</p>
                    <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                  </div>
                </div>
              </div>
            )}
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
     <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-65px)] sticky top-[65px]">
  <nav className="p-4 h-full flex flex-col justify-between">
    <div className="space-y-2">
      {menuItems.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleMenuClick(item.route)}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
            selectedMenu === item.id
              ? "bg-blue-50 text-blue-600 font-semibold"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </motion.button>
      ))}

  
    </div>

    <div>
      <div className="pt-4 border-t border-gray-200 space-y-2">
        {bottomMenuItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleMenuClick(item.route)}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
              selectedMenu === item.id
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </motion.button>
        ))}
        <Link href="/">
          <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100">
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </Link>
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

export default function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <PatientLayoutUI>{children}</PatientLayoutUI>
    </ProfileProvider>
  );
}

