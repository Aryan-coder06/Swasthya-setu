"use client";

import { useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart, Bell, LogOut, Activity, Calendar, Users, Plus,
  CreditCard, Bed, FileText, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ReceptionistLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedMenu, setSelectedMenu] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity, route: "/receptionist" },
    { id: "appointments", label: "Appointments", icon: Calendar, route: "/receptionist/appointments" },
    { id: "patients", label: "Patient Management", icon: Users, route: "/receptionist/patients" },
    { id: "walkin", label: "Walk-in Tickets", icon: Plus, route: "/receptionist/walkin" },
    { id: "billing", label: "Billing & Payments", icon: CreditCard, route: "/receptionist/billing" },
    { id: "beds", label: "Bed Management", icon: Bed, route: "/receptionist/beds" },
    { id: "reports", label: "Reports", icon: FileText, route: "/receptionist/reports" }
  ];

  useEffect(() => {
    if (pathname === '/receptionist') {
      setSelectedMenu('dashboard');
      return;
    }
    const activeItem = menuItems.find(item => item.route !== '/receptionist' && pathname.startsWith(item.route));
    if (activeItem) {
      setSelectedMenu(activeItem.id);
    }
  }, [pathname, menuItems]);

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
            <Badge variant="outline" className="bg-purple-50 text-purple-700">Reception Portal</Badge>
          </div>
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search patients..." className="pl-10 w-64" />
            </div>
            <Button size="icon" variant="outline" className="relative">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Button>
            <Avatar>
              <AvatarFallback className="bg-purple-100 text-purple-700">RC</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-65px)] sticky top-[65px]">
          <nav className="p-4 h-full flex flex-col justify-between">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <motion.button key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleMenuClick(item.route)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${selectedMenu === item.id ? "bg-purple-50 text-purple-600 font-semibold" : "text-gray-700 hover:bg-gray-100"}`}>
                  <item.icon className="w-5 h-5" /><span>{item.label}</span>
                </motion.button>
              ))}
            </div>
            <div>
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100"><Settings className="w-5 h-5" /><span>Settings</span></button>
                <Link href="/"><button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100"><LogOut className="w-5 h-5" /><span>Logout</span></button></Link>
              </div>
            </div>
          </nav>
        </aside>
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
      </div>
    </div>
  );
}