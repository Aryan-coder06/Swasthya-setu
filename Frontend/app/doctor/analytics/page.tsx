"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Users, PieChart, Activity, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDoctorProfile } from "@/app/context/DoctorProfileContext";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface DoctorStats {
  totalAppointments: number;
  recentAppointments: number;
  totalUniquePatients: number;
}

export default function DoctorAnalyticsPage() {
  const { profileData } = useDoctorProfile();
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!profileData?.id) return;

      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/api/doctor/analytics/stats/${profileData.id}`);
        setStats(response.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch analytics stats:", err);
        setError("Could not load analytics data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [profileData?.id]);

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const StatCard = ({ title, value, isLoading }: { title: string, value: string | number, isLoading: boolean }) => (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="w-24 h-10" />
        ) : (
          <p className="text-4xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-50 text-red-700 p-8 rounded-lg">
        <AlertTriangle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-semibold mb-2">An Error Occurred</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <motion.div 
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="space-y-6"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-gray-900">Practice Analytics</motion.h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants}>
          <StatCard title="Total Patients" value={stats?.totalUniquePatients ?? 0} isLoading={loading} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Appointments (Last 30 Days)" value={stats?.recentAppointments ?? 0} isLoading={loading} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <StatCard title="Total Appointments" value={stats?.totalAppointments ?? 0} isLoading={loading} />
        </motion.div>
        <motion.div variants={itemVariants}>
            <StatCard title="Avg. Rating" value={"4.8/5"} isLoading={loading} />
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><BarChart/>Appointments Overview</CardTitle></CardHeader>
          <CardContent><div className="h-64 bg-gray-200 rounded-md flex items-center justify-center"><p className="text-gray-500">Chart Placeholder</p></div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChart/>Patient Demographics</CardTitle></CardHeader>
          <CardContent><div className="h-64 bg-gray-200 rounded-md flex items-center justify-center"><p className="text-gray-500">Chart Placeholder</p></div></CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

