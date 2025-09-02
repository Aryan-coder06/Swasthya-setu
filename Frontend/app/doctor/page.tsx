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
  Stethoscope,
  Users,
  ClipboardList,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Phone,
  Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

export default function DoctorDashboard() {
  const [selectedMenu, setSelectedMenu] = useState("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "appointments", label: "Appointments", icon: Calendar },
    { id: "patients", label: "My Patients", icon: Users },
    { id: "consultations", label: "Consultations", icon: Video },
    { id: "prescriptions", label: "Prescriptions", icon: ClipboardList },
    { id: "records", label: "Medical Records", icon: FileText },
    { id: "analytics", label: "Analytics", icon: TrendingUp }
  ];

  const todayAppointments = [
    {
      id: 1,
      patient: "Emma Johnson",
      time: "09:00 AM",
      type: "Follow-up",
      status: "confirmed",
      condition: "Hypertension",
      avatar: "EJ"
    },
    {
      id: 2,
      patient: "Michael Smith",
      time: "10:30 AM",
      type: "Regular Checkup",
      status: "in-progress",
      condition: "Diabetes",
      avatar: "MS"
    },
    {
      id: 3,
      patient: "Sarah Wilson",
      time: "02:00 PM",
      type: "Consultation",
      status: "pending",
      condition: "Chest Pain",
      avatar: "SW"
    },
    {
      id: 4,
      patient: "David Brown",
      time: "03:30 PM",
      type: "Follow-up",
      status: "confirmed",
      condition: "Post Surgery",
      avatar: "DB"
    }
  ];

  const recentPatients = [
    {
      id: 1,
      name: "Alice Cooper",
      lastVisit: "2 days ago",
      condition: "Migraine",
      status: "stable",
      avatar: "AC"
    },
    {
      id: 2,
      name: "Robert King",
      lastVisit: "1 week ago",
      condition: "Heart Disease",
      status: "critical",
      avatar: "RK"
    },
    {
      id: 3,
      name: "Lisa Anderson",
      lastVisit: "3 days ago",
      condition: "Asthma",
      status: "stable",
      avatar: "LA"
    }
  ];

  const stats = [
    {
      title: "Today's Appointments",
      value: "12",
      change: "+2 from yesterday",
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-100"
    },
    {
      title: "Total Patients",
      value: "248",
      change: "+15 this month",
      icon: Users,
      color: "text-green-600",
      bg: "bg-green-100"
    },
    {
      title: "Consultations",
      value: "35",
      change: "+8 this week",
      icon: Video,
      color: "text-purple-600",
      bg: "bg-purple-100"
    },
    {
      title: "Prescriptions",
      value: "67",
      change: "+12 today",
      icon: ClipboardList,
      color: "text-orange-600",
      bg: "bg-orange-100"
    }
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
      case "in-progress": return "bg-blue-100 text-blue-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-gray-100 text-gray-800";
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
        <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Good Morning, Dr. Sarah!</h2>
                <p className="text-green-100">You have 12 appointments scheduled for today</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">248</div>
                <div className="text-sm text-green-100">Total Patients</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
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

      {/* Today's Schedule & Recent Patients */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Today's Schedule
                </CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todayAppointments.map((appointment) => (
                  <motion.div
                    key={appointment.id}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {appointment.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{appointment.patient}</div>
                        <div className="text-sm text-gray-600">{appointment.condition}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium text-sm">{appointment.time}</div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
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
                <Users className="w-5 h-5" />
                Recent Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-green-100 text-green-600">
                          {patient.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{patient.name}</div>
                        <div className="text-sm text-gray-600">{patient.condition}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm text-gray-600">{patient.lastVisit}</div>
                      <Badge className={
                        patient.status === "critical" 
                          ? "bg-red-100 text-red-800" 
                          : "bg-green-100 text-green-800"
                      }>
                        {patient.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  View All Patients
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
              <Button className="h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700">
                <Video className="w-6 h-6" />
                <span>Start Consultation</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <ClipboardList className="w-6 h-6" />
                <span>Create Prescription</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <FileText className="w-6 h-6" />
                <span>Add Medical Note</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col space-y-2">
                <Calendar className="w-6 h-6" />
                <span>Schedule Appointment</span>
              </Button>
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
            <Badge variant="outline" className="bg-green-50 text-green-700">Doctor Portal</Badge>
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
              <AvatarFallback className="bg-green-100 text-green-700">DS</AvatarFallback>
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
                      ? "bg-green-50 text-green-600 border-r-2 border-green-600"
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
          
          {selectedMenu === "appointments" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Appointments</h1>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Appointment
                </Button>
              </div>
              
              <Tabs defaultValue="today" className="w-full">
                <TabsList>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <TabsContent value="today" className="space-y-4">
                  {todayAppointments.map((appointment) => (
                    <Card key={appointment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {appointment.avatar}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold">{appointment.patient}</h3>
                              <p className="text-sm text-gray-600">{appointment.condition}</p>
                              <p className="text-sm text-gray-500">{appointment.type}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-2">
                            <div className="font-medium">{appointment.time}</div>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status}
                            </Badge>
                            <div className="space-x-2">
                              <Button size="sm" variant="outline">
                                <Phone className="w-4 h-4" />
                              </Button>
                              <Button size="sm">
                                <Video className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* Other menu content would be implemented similarly */}
        </main>
      </div>
    </div>
  );
}