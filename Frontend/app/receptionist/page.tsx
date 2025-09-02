"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Heart,
  FileText,
  User,
  Activity,
  Bell,
  Search,
  Plus,
  Settings,
  LogOut,
  Users,
  CreditCard,
  Bed,
  Printer,
  CheckCircle,
  Phone,
  MapPin,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function ReceptionistDashboard() {
  const [selectedMenu, setSelectedMenu] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "patients", label: "Patient Management", icon: Users },
    { id: "walkin", label: "Walk-in Tickets", icon: Plus },
    { id: "billing", label: "Billing & Payments", icon: CreditCard },
    { id: "beds", label: "Bed Management", icon: Bed },
    { id: "reports", label: "Reports", icon: FileText }
  ];

  const todayStats = [
    {
      title: "Total Appointments",
      value: "45",
      change: "+8 from yesterday",
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      title: "Walk-in Patients",
      value: "12",
      change: "+3 today",
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-100"
    },
    {
      title: "Payments Collected",
      value: "₹28,500",
      change: "+15% from yesterday",
      icon: CreditCard,
      color: "text-purple-600",
      bg: "bg-purple-100"
    },
    {
      title: "Available Beds",
      value: "18",
      change: "3 admissions today",
      icon: Bed,
      color: "text-orange-600",
      bg: "bg-orange-100"
    }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      patient: "John Smith",
      doctor: "Dr. Sarah Wilson",
      time: "09:30 AM",
      type: "Consultation",
      status: "confirmed",
      phone: "+91 98765 43210"
    },
    {
      id: 2,
      patient: "Emma Johnson",
      doctor: "Dr. Michael Chen",
      time: "10:15 AM",
      type: "Follow-up",
      status: "waiting",
      phone: "+91 98765 43211"
    },
    {
      id: 3,
      patient: "David Brown",
      doctor: "Dr. Lisa Anderson",
      time: "11:00 AM",
      type: "Checkup",
      status: "confirmed",
      phone: "+91 98765 43212"
    },
    {
      id: 4,
      patient: "Sarah Wilson",
      doctor: "Dr. Robert King",
      time: "02:30 PM",
      type: "Emergency",
      status: "urgent",
      phone: "+91 98765 43213"
    }
  ];

  const recentBilling = [
    {
      id: "INV001",
      patient: "Alice Cooper",
      amount: "₹2,500",
      status: "paid",
      date: "Today",
      service: "Consultation"
    },
    {
      id: "INV002",
      patient: "Robert King",
      amount: "₹4,800",
      status: "pending",
      date: "Today",
      service: "Lab Tests"
    },
    {
      id: "INV003",
      patient: "Lisa Anderson",
      amount: "₹1,200",
      status: "paid",
      date: "Yesterday",
      service: "Prescription"
    }
  ];

  const bedStatus = [
    { ward: "General Ward", total: 20, occupied: 15, available: 5, type: "general" },
    { ward: "ICU", total: 8, occupied: 6, available: 2, type: "critical" },
    { ward: "Emergency", total: 12, occupied: 8, available: 4, type: "emergency" },
    { ward: "Maternity", total: 10, occupied: 7, available: 3, type: "maternity" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "waiting": return "bg-yellow-100 text-yellow-800";
      case "urgent": return "bg-red-100 text-red-800";
      case "completed": return "bg-gray-100 text-gray-800";
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const renderDashboard = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Good Morning, Reception!</h2>
                <p className="text-purple-100">45 appointments scheduled for today</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">₹28,500</div>
                <div className="text-sm text-purple-100">Today's Collection</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {todayStats.map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="h-20 flex-col space-y-2 bg-purple-600 hover:bg-purple-700">
                <Plus className="w-6 h-6" />
                <span>Walk-in Ticket</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Calendar className="w-6 h-6" />
                <span>Schedule Appointment</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <CreditCard className="w-6 h-6" />
                <span>Process Payment</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Printer className="w-6 h-6" />
                <span>Print Receipt</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Appointments & Bed Status */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Next Appointments
                </CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.slice(0, 4).map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-purple-100 text-purple-600">
                          {appointment.patient.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{appointment.patient}</div>
                        <div className="text-sm text-gray-600">{appointment.doctor}</div>
                        <div className="text-xs text-gray-500">{appointment.type}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium text-sm">{appointment.time}</div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <Phone className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="w-5 h-5" />
                Bed Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bedStatus.map((ward, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{ward.ward}</div>
                      <div className={`text-sm font-medium ${
                        ward.available > 3 ? 'text-green-600' : 
                        ward.available > 1 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {ward.available} Available
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{ward.occupied}/{ward.total} Occupied</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(ward.occupied / ward.total) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Manage Bed Allocation
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Billing */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Recent Billing
              </CardTitle>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBilling.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="font-medium">{bill.patient}</div>
                      <div className="text-sm text-gray-600">{bill.service}</div>
                      <div className="text-xs text-gray-500">Invoice: {bill.id}</div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="font-bold text-lg">{bill.amount}</div>
                    <Badge className={getStatusColor(bill.status)}>
                      {bill.status}
                    </Badge>
                    <div className="text-xs text-gray-500">{bill.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 healthcare-gradient rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
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
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <nav className="p-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMenu(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    selectedMenu === item.id
                      ? "bg-purple-50 text-purple-600 border-r-2 border-purple-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="space-y-2">
                <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-gray-700 hover:bg-gray-100">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </button>
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

        {/* Main Content */}
        <main className="flex-1 p-6">
          {selectedMenu === "dashboard" && renderDashboard()}
          
          {selectedMenu === "walkin" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Walk-in Ticket Management</h1>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate New Ticket
                </Button>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Current Queue</CardTitle>
                  <CardDescription>Manage walk-in patients and ticket queue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-6xl font-bold text-gray-300 mb-4">12</div>
                    <div className="text-lg text-gray-600">Patients in Queue</div>
                    <div className="mt-4 space-x-4">
                      <Button>Next Patient</Button>
                      <Button variant="outline">Generate Ticket</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Other menu content would be implemented similarly */}
        </main>
      </div>
    </div>
  );
}