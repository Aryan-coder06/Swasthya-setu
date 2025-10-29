// "use client";

// import { motion } from "framer-motion";
// import {
//   Calendar, Users, CreditCard, Bed, Plus, Printer, Phone
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// export default function ReceptionistDashboardPage() {
//   const todayStats = [
//     { title: "Total Appointments", value: "45", change: "+8 from yesterday", icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
//     { title: "Walk-in Patients", value: "12", change: "+3 today", icon: Users, color: "text-green-600", bg: "bg-green-100" },
//     { title: "Payments Collected", value: "₹28,500", change: "+15% from yesterday", icon: CreditCard, color: "text-purple-600", bg: "bg-purple-100" },
//     { title: "Available Beds", value: "18", change: "3 admissions today", icon: Bed, color: "text-orange-600", bg: "bg-orange-100" }
//   ];

//   const upcomingAppointments = [
//     { id: 1, patient: "John Smith", doctor: "Dr. Sarah Wilson", time: "09:30 AM", type: "Consultation", status: "confirmed" },
//     { id: 2, patient: "Emma Johnson", doctor: "Dr. Michael Chen", time: "10:15 AM", type: "Follow-up", status: "waiting" },
//     { id: 3, patient: "David Brown", doctor: "Dr. Lisa Anderson", time: "11:00 AM", type: "Checkup", status: "confirmed" },
//   ];
  
//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "confirmed": return "bg-green-100 text-green-800";
//       case "waiting": return "bg-yellow-100 text-yellow-800";
//       default: return "bg-gray-100 text-gray-800";
//     }
//   };

//   const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
//   const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

//   return (
//     <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
//       <motion.div variants={itemVariants}>
//         <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
//           <CardContent className="p-6">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h2 className="text-2xl font-bold mb-2">Good Morning, Reception!</h2>
//                 <p className="text-purple-100">45 appointments scheduled for today</p>
//               </div>
//               <div className="text-right">
//                 <div className="text-3xl font-bold">₹28,500</div>
//                 <div className="text-sm text-purple-100">Today's Collection</div>
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </motion.div>

//       <motion.div variants={itemVariants}>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {todayStats.map((stat, index) => (
//             <motion.div key={index} whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm text-gray-600">{stat.title}</p>
//                   <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
//                   <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
//                 </div>
//                 <div className={`p-3 rounded-full ${stat.bg}`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
//               </div>
//             </motion.div>
//           ))}
//         </div>
//       </motion.div>

//       <motion.div variants={itemVariants}>
//         <Card>
//           <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />Quick Actions</CardTitle></CardHeader>
//           <CardContent>
//             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//               <Button className="h-20 flex-col space-y-2 bg-purple-600 hover:bg-purple-700"><Plus className="w-6 h-6" /><span>Walk-in Ticket</span></Button>
//               <Button variant="outline" className="h-20 flex-col space-y-2"><Calendar className="w-6 h-6" /><span>Schedule Appointment</span></Button>
//               <Button variant="outline" className="h-20 flex-col space-y-2"><CreditCard className="w-6 h-6" /><span>Process Payment</span></Button>
//               <Button variant="outline" className="h-20 flex-col space-y-2"><Printer className="w-6 h-6" /><span>Print Receipt</span></Button>
//             </div>
//           </CardContent>
//         </Card>
//       </motion.div>

//       <div className="grid lg:grid-cols-2 gap-6">
//         <motion.div variants={itemVariants}>
//           <Card>
//             <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Next Appointments</CardTitle><Button variant="outline" size="sm">View All</Button></div></CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 {upcomingAppointments.map((appointment) => (
//                   <motion.div key={appointment.id} whileHover={{ scale: 1.02 }} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
//                     <div className="flex items-center space-x-3">
//                       <Avatar><AvatarFallback className="bg-purple-100 text-purple-600">{appointment.patient.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
//                       <div>
//                         <div className="font-medium">{appointment.patient}</div>
//                         <div className="text-sm text-gray-600">{appointment.doctor}</div>
//                       </div>
//                     </div>
//                     <div className="text-right space-y-1">
//                       <div className="font-medium text-sm">{appointment.time}</div>
//                       <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div variants={itemVariants}>
//           <Card>
//             <CardHeader><CardTitle className="flex items-center gap-2"><Bed className="w-5 h-5" />Bed Availability</CardTitle></CardHeader>
//             <CardContent><Button variant="outline" className="w-full">Manage Bed Allocation</Button></CardContent>
//           </Card>
//         </motion.div>
//       </div>
//     </motion.div>
//   );
// }


"use client";

import { motion } from "framer-motion";
import {
  Calendar, Users, CreditCard, Bed, Plus, Printer, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect } from "react";

export default function ReceptionistDashboardPage() {
  const API_BASE = 'http://localhost:5000'; // Adjust this to your backend's URL and port (e.g., from process.env.NEXT_PUBLIC_API_URL)

  const [dashboardData, setDashboardData] = useState({
    todayAppointments: 0,
    todayWalkins: 0,
    todayPayments: 0,
    availableBeds: 0
  });

  const [appointments, setAppointments] = useState<any[]>([]); // Type as per your data structure
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Reception");

  useEffect(() => {
    // Load user name from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.firstName) {
          setUserName(userData.firstName);
        }
      } catch (err) {
        console.error('Failed to parse user data:', err);
      }
    }

    const fetchDashboardData = async () => {
      try {
        const statsRes = await fetch(`${API_BASE}/receptionist/dashboard/stats`);
        if (!statsRes.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsRes.json();
        setDashboardData(statsData);

        const apptsRes = await fetch(`${API_BASE}/receptionist/appointments/all`);
        if (!apptsRes.ok) throw new Error('Failed to fetch appointments');
        const apptsData = await apptsRes.json();
        setAppointments(apptsData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Compute todayStats dynamically based on fetched data (changes remain static for now)
  const todayStats = [
    { title: "Total Appointments", value: dashboardData.todayAppointments, change: "+8 from yesterday", icon: Calendar, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Walk-in Patients", value: dashboardData.todayWalkins, change: "+3 today", icon: Users, color: "text-green-600", bg: "bg-green-100" },
    { title: "Payments Collected", value: `₹${dashboardData.todayPayments.toLocaleString()}`, change: "+15% from yesterday", icon: CreditCard, color: "text-purple-600", bg: "bg-purple-100" },
    { title: "Available Beds", value: dashboardData.availableBeds, change: "3 admissions today", icon: Bed, color: "text-orange-600", bg: "bg-orange-100" }
  ];

  // Filter and sort upcoming appointments (next 3 for today or future)
  const getUpcomingAppointments = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 8);

    const filtered = appointments.filter(app => 
      app.appointment_date > today || 
      (app.appointment_date === today && app.appointment_time >= currentTime)
    );

    filtered.sort((a, b) => {
      const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
      return dateCompare !== 0 ? dateCompare : a.appointment_time.localeCompare(b.appointment_time);
    });

    return filtered.slice(0, 3).map((app, index) => ({
      id: app.id,
      patient: app.patient_name,
      doctor: `Dr. ${app.doctor?.firstName || ''} ${app.doctor?.lastName || ''}`,
      time: app.appointment_time,
      type: "Appointment", // Static since no type in backend
      status: app.status
    }));
  };

  const upcomingAppointments = getUpcomingAppointments();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "waiting": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-600">Error: {error}</div>;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Good Morning, {userName}!</h2>
                <p className="text-purple-100">{dashboardData.todayAppointments} appointments scheduled for today</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">₹{dashboardData.todayPayments.toLocaleString()}</div>
                <div className="text-sm text-purple-100">Today's Collection</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {todayStats.map((stat, index) => (
            <motion.div key={index} whileHover={{ scale: 1.02 }} className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow">
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

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />Quick Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="h-20 flex-col space-y-2 bg-purple-600 hover:bg-purple-700"><Plus className="w-6 h-6" /><span>Walk-in Ticket</span></Button>
              <Button variant="outline" className="h-20 flex-col space-y-2"><Calendar className="w-6 h-6" /><span>Schedule Appointment</span></Button>
              <Button variant="outline" className="h-20 flex-col space-y-2"><CreditCard className="w-6 h-6" /><span>Process Payment</span></Button>
              <Button variant="outline" className="h-20 flex-col space-y-2"><Printer className="w-6 h-6" /><span>Print Receipt</span></Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Next Appointments</CardTitle><Button variant="outline" size="sm">View All</Button></div></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <motion.div key={appointment.id} whileHover={{ scale: 1.02 }} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <Avatar><AvatarFallback className="bg-purple-100 text-purple-600">{appointment.patient.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-medium">{appointment.patient}</div>
                        <div className="text-sm text-gray-600">{appointment.doctor}</div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-medium text-sm">{appointment.time}</div>
                      <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                    </div>
                  </motion.div>
                ))}
                {upcomingAppointments.length === 0 && <p className="text-center text-gray-500">No upcoming appointments</p>}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Bed className="w-5 h-5" />Bed Availability</CardTitle></CardHeader>
            <CardContent><Button variant="outline" className="w-full">Manage Bed Allocation</Button></CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}