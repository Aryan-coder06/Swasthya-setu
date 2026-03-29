"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Clock, FileText, Plus, Stethoscope, AlertCircle, Activity, Phone, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useProfile } from "@/app/context/ProfileContext"; 
import axios from "axios";
import { apiRoute } from "@/config/env";

// UI Components for Modals
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function PatientDashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { profileData } = useProfile(); 

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // State for uploaded file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Mock Data for the dashboard widgets
  const upcomingAppointments = [
    { id: 1, doctor: "Dr. Siddharth Jain", specialty: "Cardiologist", date: "Tomorrow", time: "2:15 PM", status: "confirmed" },
    { id: 2, doctor: "Dr. Priya Nair", specialty: "General Medicine", date: "Oct 28", time: "10:15 AM", status: "pending" },
  ];
  const healthMetrics = [
    { label: "Blood Pressure", value: "119/78", status: "normal", color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Heart Rate", value: "74 BPM", status: "normal", color: "text-emerald-600", bg: "bg-emerald-100" },
  ];
  const recentActivities = [
    { type: "appointment", message: "Appointment confirmed with Dr. Siddharth Jain", time: "2 hours ago" },
    { type: "report", message: "Lab results uploaded - Blood Test", time: "1 day ago" },
  ];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "book-appointment": setShowBookingModal(true); break;
      case "upload-report": setShowUploadModal(true); break;
      case "ai-consultation": router.push("/patient/ai-consultation"); break;
      case "emergency": setShowEmergencyModal(true); break;
    }
  };

  const handleBookAppointment = () => {
    toast({ title: "Appointment Booked!", description: "Your appointment has been successfully scheduled." });
    setShowBookingModal(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUploadReport = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }
    
    if (!profileData?.id) {
      toast({
        title: "Authentication Error",
        description: "Could not find user ID. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("userId", profileData.id);

    try {
      await axios.post(apiRoute("/profile/docs/add_doc"), formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast({
        title: "Report Uploaded!",
        description: "Your medical report has been successfully uploaded.",
      });
      setSelectedFile(null); 
      setShowUploadModal(false);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.response?.data?.docError || "Failed to upload report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEmergencyCall = () => {
    toast({ title: "Emergency Alert Sent!", description: "Emergency services have been contacted." });
    setShowEmergencyModal(false);
    router.push("/patient/emergency");
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        
        {/* Welcome Section */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-cyan-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/10 border-0 relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-10 -mb-10 w-32 h-32 bg-black/5 rounded-full blur-xl"></div>
            
            <CardContent className="p-8 relative z-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2 tracking-tight">Good Morning, {profileData?.firstName || "Patient"}!</h2>
                  <p className="text-cyan-50 text-lg opacity-90">Your health is our priority. How are you feeling today?</p>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-white/20 backdrop-blur-sm px-6 py-4 border border-white/20 shadow-inner">
                  <div className="flex flex-col items-center sm:items-end">
                    <div className="text-4xl font-extrabold tracking-tight">75</div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-cyan-50 mt-1">Health Score</div>
                  </div>
                  <Activity className="w-10 h-10 text-white opacity-80" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-600" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              <Button
                variant="outline"
                className="h-28 flex flex-col gap-3 rounded-2xl border-slate-200 hover:border-cyan-400 hover:bg-cyan-50 transition-all shadow-sm hover:shadow-md"
                onClick={() => handleQuickAction("book-appointment")}
              >
                <div className="p-2.5 bg-cyan-100 rounded-xl text-cyan-600"><Calendar className="h-6 w-6" /></div>
                <span className="font-semibold text-slate-700">Book Appt</span>
              </Button>
              <Button
                variant="outline"
                className="h-28 flex flex-col gap-3 rounded-2xl border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm hover:shadow-md"
                onClick={() => handleQuickAction("upload-report")}
              >
                <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600"><FileText className="h-6 w-6" /></div>
                <span className="font-semibold text-slate-700">Upload</span>
              </Button>
              <Button
                variant="outline"
                className="h-28 flex flex-col gap-3 rounded-2xl border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all shadow-sm hover:shadow-md"
                onClick={() => handleQuickAction("ai-consultation")}
              >
                <div className="p-2.5 bg-blue-100 rounded-xl text-blue-600"><Stethoscope className="h-6 w-6" /></div>
                <span className="font-semibold text-slate-700">AI Consult</span>
              </Button>
              <Button
                variant="outline"
                className="h-28 flex flex-col gap-3 rounded-2xl border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all shadow-sm hover:shadow-md"
                onClick={() => router.push("/patient/analyze-prescription")}
              >
                <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600"><FileText className="h-6 w-6" /></div>
                <span className="font-semibold text-slate-700">Analyze</span>
              </Button>
              <Button
                variant="outline"
                className="h-28 flex flex-col gap-3 rounded-2xl border-red-100 hover:border-red-400 hover:bg-red-50 transition-all shadow-sm hover:shadow-md col-span-2 sm:col-span-1"
                onClick={() => handleQuickAction("emergency")}
              >
                <div className="p-2.5 bg-red-100 rounded-xl text-red-600 animate-pulse"><AlertCircle className="h-6 w-6" /></div>
                <span className="font-semibold text-red-600">Emergency</span>
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Health Metrics & Appointments */}
        <div className="grid lg:grid-cols-2 gap-8">
          <motion.div variants={itemVariants}>
            <Card className="h-full border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Health Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {healthMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-10 rounded-full ${metric.bg}`}></div>
                      <div>
                        <div className="font-semibold text-slate-800">{metric.label}</div>
                        <div className="text-sm text-slate-500 font-medium capitalize mt-0.5">{metric.status}</div>
                      </div>
                    </div>
                    <div className={`text-xl font-bold tracking-tight ${metric.color}`}>
                      {metric.value}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={itemVariants}>
            <Card className="h-full border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="pb-4 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                  <Calendar className="w-5 h-5 text-cyan-500" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 border border-slate-100 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12 border-2 border-cyan-100">
                        <AvatarFallback className="bg-cyan-50 text-cyan-700 font-bold">
                          {appointment.doctor.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold text-slate-800">{appointment.doctor}</div>
                        <div className="text-sm text-slate-500 font-medium">{appointment.specialty}</div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <div className="font-semibold text-slate-800">{appointment.date}</div>
                      <div className="text-sm text-slate-500">{appointment.time}</div>
                      <Badge variant="secondary" className={appointment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="ghost" className="w-full text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 mt-2 font-semibold" onClick={() => router.push('/patient/appointments')}>
                  View All Appointments <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activities */}
        <motion.div variants={itemVariants}>
          <Card className="border-slate-200 shadow-sm rounded-2xl">
            <CardHeader className="pb-4 border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                <Clock className="w-5 h-5 text-indigo-500" />
                Recent Activities
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activity.type === 'appointment' ? 'bg-cyan-100' : 'bg-emerald-100'}`}>
                      {activity.type === 'appointment' && <Calendar className="w-5 h-5 text-cyan-600" />}
                      {activity.type === 'report' && <FileText className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="font-medium text-slate-800">{activity.message}</div>
                      <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {activity.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-2xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Book New Appointment</DialogTitle>
            <DialogDescription>Schedule an appointment with your preferred doctor</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="specialty" className="text-slate-700">Specialty</Label>
                <Select>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select specialty" /></SelectTrigger>
                  <SelectContent><SelectItem value="cardiology">Cardiology</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor" className="text-slate-700">Doctor</Label>
                <Select>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent><SelectItem value="dr-iyer">Dr. Kavya Iyer</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-slate-700">Preferred Date</Label>
                <Input type="date" className="rounded-lg" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-slate-700">Time Slot</Label>
                <Select>
                  <SelectTrigger className="rounded-lg"><SelectValue placeholder="Select time" /></SelectTrigger>
                  <SelectContent><SelectItem value="9am">9:00 AM</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-slate-700">Reason for Visit</Label>
              <Textarea placeholder="Brief description of your concern" className="rounded-lg min-h-[100px]" />
            </div>
            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
              <Button variant="outline" className="rounded-lg" onClick={() => setShowBookingModal(false)}>Cancel</Button>
              <Button onClick={handleBookAppointment} className="rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-500 hover:opacity-90 text-white border-0">
                Book Appointment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-md sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Upload Medical Report</DialogTitle>
            <DialogDescription>Upload your medical documents, reports, or prescriptions</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            <div className="border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors rounded-xl p-10 text-center flex flex-col items-center justify-center">
              <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <FileText className="w-8 h-8 text-cyan-500" />
              </div>
              <p className="text-base font-semibold text-slate-800 mb-1">
                {selectedFile ? selectedFile.name : "Drop files here or click to browse"}
              </p>
              <p className="text-sm text-slate-500 mb-6">Supports PDF, JPG, PNG files up to 10MB</p>
              
              <Input type="file" onChange={handleFileChange} className="hidden" id="file-upload" />
              <Label 
                htmlFor="file-upload" 
                className="cursor-pointer inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-colors bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm h-10 px-6 py-2"
              >
                Choose File
              </Label>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" className="rounded-lg" onClick={() => setShowUploadModal(false)}>Cancel</Button>
              <Button onClick={handleUploadReport} className="rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-500 hover:opacity-90 text-white border-0" disabled={!selectedFile}>
                Upload Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Modal */}
      <Dialog open={showEmergencyModal} onOpenChange={setShowEmergencyModal}>
        <DialogContent className="max-w-md sm:rounded-2xl border-red-100">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2 text-xl">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-5 h-5" />
              </div>
              Emergency SOS
            </DialogTitle>
            <DialogDescription className="pt-2">Are you sure you want to call emergency services?</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 mt-2">
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
              <p className="text-sm text-red-800 font-medium leading-relaxed">
                This action will immediately contact local emergency services and notify your registered emergency contacts.
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="outline" className="rounded-lg border-slate-200" onClick={() => setShowEmergencyModal(false)}>Cancel</Button>
              <Button onClick={handleEmergencyCall} className="rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md transition-all">
                <Phone className="w-4 h-4 mr-2" /> Call Emergency
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}