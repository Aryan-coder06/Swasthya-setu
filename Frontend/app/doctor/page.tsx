"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, ClipboardList, TrendingUp } from "lucide-react";
import axios from "axios";
import { apiRoute } from "@/config/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useDoctorProfile } from "../context/DoctorProfileContext";
import { useRouter } from "next/navigation";

interface DashboardResponse {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
  };
  stats: {
    totalAppointments: number;
    recentAppointments: number;
    totalUniquePatients: number;
  };
  todayAppointments: Array<{
    id: number;
    patientName: string;
    appointmentTime: string | null;
    status: string;
    meetingLink: string | null;
  }>;
  recentPatients: Array<{
    id: string | null;
    name: string;
    lastVisit: string | null;
    status: string;
  }>;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "in-progress":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-slate-200 text-slate-800";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function DoctorDashboardPage() {
  const { profileData } = useDoctorProfile();
  const { toast } = useToast();
  const router = useRouter();

  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profileData.id) return;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const response = await axios.get<DashboardResponse>(
          apiRoute(`/api/doctor/${profileData.id}/dashboard`),
          { params: { t: Date.now() } }
        );
        setDashboard(response.data);
      } catch (error: any) {
        console.error("Failed to load doctor dashboard:", error);
        toast({
          title: "Unable to load dashboard",
          description: error.response?.data?.error || "Please try again shortly.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [profileData.id, toast]);

  const statsCards = useMemo(() => {
    const stats = dashboard?.stats;
    return [
      {
        title: "Today's Appointments",
        value: dashboard?.todayAppointments?.length ?? 0,
        caption: "Scheduled for today",
        icon: Calendar,
        color: "text-blue-600",
        bg: "bg-blue-100",
      },
      {
        title: "Total Patients",
        value: stats?.totalUniquePatients ?? 0,
        caption: "Across your history",
        icon: Users,
        color: "text-green-600",
        bg: "bg-green-100",
      },
      {
        title: "30-day Appointments",
        value: stats?.recentAppointments ?? 0,
        caption: "Last 30 days",
        icon: TrendingUp,
        color: "text-purple-600",
        bg: "bg-purple-100",
      },
      {
        title: "All Time Visits",
        value: stats?.totalAppointments ?? 0,
        caption: "Recorded in system",
        icon: ClipboardList,
        color: "text-amber-600",
        bg: "bg-amber-100",
      },
    ];
  }, [dashboard]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Morning";
    if (hour < 18) return "Afternoon";
    return "Evening";
  }, []);

  const quickActions = useMemo(
    () => [
      {
        title: "Schedule follow-up",
        description: "Book a new slot or convert a consultation to an in-person visit.",
        action: () => router.push("/doctor/appointments"),
      },
      {
        title: "Launch virtual clinic",
        description: "Start a video consultation room for the next appointment.",
        action: () => router.push("/doctor/consultations"),
      },
      {
        title: "Review prescriptions",
        description: "Generate, edit or analyze prescriptions shared with patients.",
        action: () => router.push("/doctor/prescriptions"),
      },
    ],
    [router]
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  {`Good ${greeting}, ${profileData.firstName ? `Dr. ${profileData.firstName}` : "Doctor"}`}
                </h2>
                <p className="text-emerald-50">
                  {dashboard?.todayAppointments?.length
                    ? `You have ${dashboard.todayAppointments.length} appointment${dashboard.todayAppointments.length > 1 ? "s" : ""} today.`
                    : "No appointments scheduled for today yet."}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-white/50 shadow-inner">
                  <AvatarFallback className="bg-white/30 text-white text-xl">
                    {profileData.firstName?.[0]}
                    {profileData.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="text-right">
                  <div className="text-3xl font-bold">
                    {dashboard?.stats?.totalUniquePatients ?? "--"}
                  </div>
                  <div className="text-sm text-emerald-50">Total Patients</div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-emerald-50/90">
              {profileData.specialty && (
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 backdrop-blur">
                  Specialty: {profileData.specialty}
                </span>
              )}
              {profileData.hospitalName && (
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 backdrop-blur">
                  {profileData.hospitalName}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <motion.div
              key={stat.title}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? <Skeleton className="h-6 w-16" /> : stat.value}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{stat.caption}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />Today&apos;s Schedule
                </CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-16 w-full" />
                  ))}
                </div>
              ) : dashboard?.todayAppointments?.length ? (
                <div className="space-y-4">
                  {dashboard.todayAppointments.map((appointment) => (
                    <motion.div
                      key={appointment.id}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {appointment.patientName
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{appointment.patientName}</div>
                          <div className="text-sm text-gray-600">
                            {appointment.meetingLink ? "Video Consultation" : "In-person"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-medium text-sm">
                          {appointment.appointmentTime || "TBD"}
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No appointments scheduled for today.
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />Recent Patients
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-16 w-full" />
                  ))}
                </div>
              ) : dashboard?.recentPatients?.length ? (
                <div className="space-y-4">
                  {dashboard.recentPatients.map((patient, index) => (
                    <div
                      key={`${patient.id ?? patient.name}-${index}`}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {patient.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{patient.name}</div>
                          <div className="text-sm text-gray-600">
                            Last visit: {patient.lastVisit || "N/A"}
                          </div>
                        </div>
                      </div>
                      <Badge className={getStatusColor(patient.status)}> {patient.status} </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No recent patients recorded.
                </p>
              )}
              <Button variant="outline" className="w-full mt-4">
                View All Patients
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <Card className="border border-gray-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {quickActions.map((action) => (
              <div key={action.title} className="rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-medium text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                <Button variant="outline" className="mt-4" onClick={action.action}>
                  Open
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
