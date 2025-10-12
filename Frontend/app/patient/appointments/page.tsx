"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Plus,
  Search,
  Filter,
  MapPin,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function AppointmentsPage() {
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const { toast } = useToast();

  const appointments = [
    { id: 1, doctor: "Dr. Sarah Wilson", specialty: "Cardiologist", hospital: "City General Hospital", date: "2025-10-15", time: "2:00 PM", status: "confirmed", avatar: "SW", fee: "₹800" },
    { id: 2, doctor: "Dr. Michael Chen", specialty: "General Medicine", hospital: "Metro Health Center", date: "2025-10-18", time: "10:30 AM", status: "pending", avatar: "MC", fee: "₹500" },
    { id: 3, doctor: "Dr. Lisa Anderson", specialty: "Dermatologist", hospital: "Skin Care Clinic", date: "2025-10-12", time: "4:00 PM", status: "completed", avatar: "LA", fee: "₹600" },
  ];
  
  const doctors = [
    { id: 1, name: "Dr. Sarah Wilson", specialty: "Cardiologist", fee: "₹800" },
    { id: 2, name: "Dr. Michael Chen", specialty: "General Medicine", fee: "₹500" },
  ];

  const timeSlots = ["9:00 AM", "10:00 AM", "2:00 PM", "3:00 PM"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleBookAppointment = () => {
    toast({
      title: "Appointment Booked!",
      description: "Your appointment has been successfully scheduled.",
    });
    setShowBookingModal(false);
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage all your upcoming and past medical appointments.</p>
        </div>
        <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
          <DialogTrigger asChild>
            <Button className="healthcare-gradient"><Plus className="w-4 h-4 mr-2" />Book Appointment</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>Schedule an appointment with your preferred doctor.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Specialty</Label><Select><SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger><SelectContent><SelectItem value="cardiology">Cardiology</SelectItem></SelectContent></Select></div>
                <div><Label>Doctor</Label><Select><SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger><SelectContent>{doctors.map((doc) => (<SelectItem key={doc.id} value={doc.id.toString()}>{doc.name}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Date</Label><Input type="date" /></div>
                <div><Label>Time</Label><Select><SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger><SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setShowBookingModal(false)}>Cancel</Button>
                <Button onClick={handleBookAppointment} className="healthcare-gradient">Book Appointment</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><Input placeholder="Search appointments..." className="pl-10 w-64" /></div>
          <Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" />Filter</Button>
        </div>
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}><TabsList><TabsTrigger value="list">List View</TabsTrigger><TabsTrigger value="calendar">Calendar View</TabsTrigger></TabsList></Tabs>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {viewMode === 'list' ? (
          <div className="space-y-4">
            {appointments.map(appt => (
              <motion.div key={appt.id} variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12"><AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">{appt.avatar}</AvatarFallback></Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{appt.doctor}</h3>
                        <p className="text-sm text-gray-500">{appt.specialty}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{new Date(appt.date).toLocaleDateString('en-US', {month: 'long', day: 'numeric'})}</p>
                      <p className="text-sm text-gray-500">{appt.time}</p>
                      <Badge className={`${getStatusColor(appt.status)} capitalize mt-1`}>{appt.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card>
             <CardHeader><div className="flex items-center justify-between"><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Calendar View</CardTitle><div className="flex items-center space-x-2"><Button variant="outline" size="sm"><ChevronLeft className="w-4 h-4" /></Button><span className="font-medium">October 2025</span><Button variant="outline" size="sm"><ChevronRight className="w-4 h-4" /></Button></div></div></CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center font-medium text-gray-600 mb-2">{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => <div key={day} className="py-2">{day}</div>)}</div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({length: 35}).map((_, i) => {
                  const day = i - 2;
                  const hasAppt = [12, 15, 18].includes(day);
                  return <div key={i} className={`h-24 p-2 text-left border rounded-lg ${day > 0 && day <= 31 ? 'cursor-pointer hover:bg-gray-50' : 'bg-gray-50 text-gray-400'} ${hasAppt ? 'bg-blue-50 border-blue-200' : ''}`}><div className="font-medium">{day > 0 && day <= 31 ? day : ''}</div></div>
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
