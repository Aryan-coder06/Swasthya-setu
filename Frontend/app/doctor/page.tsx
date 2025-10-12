"use client";

import { motion } from "framer-motion";
import {
  Calendar, Users, Video, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDoctorProfile } from "../context/DoctorProfileContext";

export default function DoctorDashboardPage() {
  const { profileData } = useDoctorProfile();

  const todayAppointments = [
    { id: 1, patient: "Emma Johnson", time: "09:00 AM", status: "confirmed", condition: "Hypertension", avatar: "EJ" },
    { id: 2, patient: "Michael Smith", time: "10:30 AM", status: "in-progress", condition: "Diabetes", avatar: "MS" },
  ];

  const recentPatients = [
    { id: 1, name: "Alice Cooper", lastVisit: "2 days ago", condition: "Migraine", status: "stable", avatar: "AC" },
    { id: 2, name: "Robert King", lastVisit: "1 week ago", condition: "Heart Disease", status: "critical", avatar: "RK" },
  ];

  const stats = [
    { title: "Today's Appointments", value: "12", change: "+2 from yesterday", icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Total Patients", value: "248", change: "+15 this month", icon: Users, color: "text-green-600", bg: "bg-green-100" },
  ];

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "in-progress": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Good Morning, Dr. {profileData.firstName}!</h2>
                <p className="text-green-100">You have 12 appointments scheduled for today.</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">248</div>
                <div className="text-sm text-green-100">Total Patients</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, index) => (
            <motion.div key={index} whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Today's Schedule</CardTitle><Button variant="outline" size="sm">View All</Button></div></CardHeader>
            <CardContent><div className="space-y-4">{todayAppointments.map((appointment) => (<motion.div key={appointment.id} whileHover={{ scale: 1.02 }} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"><div className="flex items-center space-x-3"><Avatar><AvatarFallback className="bg-blue-100 text-blue-600">{appointment.avatar}</AvatarFallback></Avatar><div><div className="font-medium">{appointment.patient}</div><div className="text-sm text-gray-600">{appointment.condition}</div></div></div><div className="text-right space-y-1"><div className="font-medium text-sm">{appointment.time}</div><Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge></div></motion.div>))}</div></CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Recent Patients</CardTitle></CardHeader>
            <CardContent><div className="space-y-4">{recentPatients.map((patient) => (<div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center space-x-3"><Avatar><AvatarFallback className="bg-green-100 text-green-600">{patient.avatar}</AvatarFallback></Avatar><div><div className="font-medium">{patient.name}</div><div className="text-sm text-gray-600">{patient.condition}</div></div></div><div className="text-right space-y-1"><div className="text-sm text-gray-600">{patient.lastVisit}</div><Badge className={patient.status === "critical" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>{patient.status}</Badge></div></div>))}
            <Button variant="outline" className="w-full mt-4">View All Patients</Button></div></CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}


