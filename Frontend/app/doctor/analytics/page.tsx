"use client";

import { motion } from "framer-motion";
import { BarChart, Users, PieChart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DoctorAnalyticsPage() {
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

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
            <Card><CardHeader><CardTitle>Total Patients</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">248</p></CardContent></Card>
        </motion.div>
        <motion.div variants={itemVariants}>
            <Card><CardHeader><CardTitle>Appointments This Month</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">112</p></CardContent></Card>
        </motion.div>
        <motion.div variants={itemVariants}>
            <Card><CardHeader><CardTitle>Avg. Rating</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">4.8/5</p></CardContent></Card>
        </motion.div>
        <motion.div variants={itemVariants}>
            <Card><CardHeader><CardTitle>Consultations</CardTitle></CardHeader><CardContent><p className="text-4xl font-bold">35</p></CardContent></Card>
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

