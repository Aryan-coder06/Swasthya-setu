"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar, Clock, FileText, Plus, Stethoscope, AlertCircle, Activity, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useProfile } from "@/app/context/ProfileContext"; // Import the context hook
import axios from "axios";

// UI Components for Modals
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function PatientDashboardPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { profileData } = useProfile(); // Get profile data from the global context

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // State for uploaded file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Mock Data for the dashboard widgets
  const upcomingAppointments = [
    { id: 1, doctor: "Dr. Sarah Wilson", specialty: "Cardiologist", date: "Tomorrow", time: "2:00 PM", status: "confirmed" },
    { id: 2, doctor: "Dr. Michael Chen", specialty: "General Medicine", date: "Oct 28", time: "10:30 AM", status: "pending" },
  ];
  const healthMetrics = [
    { label: "Blood Pressure", value: "120/80", status: "normal", color: "text-green-600" },
    { label: "Heart Rate", value: "72 BPM", status: "normal", color: "text-green-600" },
  ];
  const recentActivities = [
    { type: "appointment", message: "Appointment confirmed with Dr. Sarah Wilson", time: "2 hours ago" },
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
      await axios.post("http://localhost:5000/profile/docs/add_doc", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast({
        title: "Report Uploaded!",
        description: "Your medical report has been successfully uploaded.",
      });
      setSelectedFile(null); // Clear the file selection
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
    <>
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Welcome Section */}
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  {/* Welcome message is now dynamic */}
                  <h2 className="text-2xl font-bold mb-2">Good Morning, {profileData?.firstName || 'Patient'}!</h2>
                  <p className="text-blue-100">Your health is our priority. How are you feeling today?</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">96</div>
                  <div className="text-sm text-blue-100">Health Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />Quick Actions</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <Button className="h-20 flex-col space-y-2" onClick={() => handleQuickAction("book-appointment")}><Calendar className="w-6 h-6" /><span>Book Appointment</span></Button>
                        <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => handleQuickAction("upload-report")}><FileText className="w-6 h-6" /><span>Upload Report</span></Button>
                        <Button variant="outline" className="h-20 flex-col space-y-2" onClick={() => handleQuickAction("ai-consultation")}><Stethoscope className="w-6 h-6" /><span>AI Consultation</span></Button>
                        <Button variant="destructive" className="h-20 flex-col space-y-2" onClick={() => handleQuickAction("emergency")}><AlertCircle className="w-6 h-6" /><span>Emergency</span></Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        {/* Health Metrics & Appointments */}
        <div className="grid lg:grid-cols-2 gap-6">
            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" />Health Metrics</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {healthMetrics.map((metric, index) => (<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"><div><div className="font-medium">{metric.label}</div><div className="text-sm text-gray-600 capitalize">{metric.status}</div></div><div className={`text-lg font-bold ${metric.color}`}>{metric.value}</div></div>))}
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5" />Upcoming Appointments</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {upcomingAppointments.map((appointment) => (<div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center space-x-3"><Avatar><AvatarFallback>{appointment.doctor.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar><div><div className="font-medium">{appointment.doctor}</div><div className="text-sm text-gray-600">{appointment.specialty}</div></div></div><div className="text-right"><div className="font-medium">{appointment.date}</div><div className="text-sm text-gray-600">{appointment.time}</div><Badge className={appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{appointment.status}</Badge></div></div>))}
                        <Button variant="outline" className="w-full" onClick={() => router.push('/patient/appointments')}>View All Appointments</Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        {/* Recent Activities */}
        <motion.div variants={itemVariants}>
            <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />Recent Activities</CardTitle></CardHeader>
                <CardContent><div className="space-y-4">{recentActivities.map((activity, index) => (<div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">{activity.type === 'appointment' && <Calendar className="w-4 h-4 text-blue-600" />}{activity.type === 'report' && <FileText className="w-4 h-4 text-green-600" />}</div><div className="flex-1"><div className="font-medium">{activity.message}</div><div className="text-sm text-gray-600">{activity.time}</div></div></div>))}</div></CardContent>
            </Card>
        </motion.div>
      </motion.div>

      {/* Modals */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Book New Appointment</DialogTitle><DialogDescription>Schedule an appointment with your preferred doctor</DialogDescription></DialogHeader><div className="space-y-6"><div className="grid grid-cols-2 gap-4"><div><Label htmlFor="specialty">Specialty</Label><Select><SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger><SelectContent><SelectItem value="cardiology">Cardiology</SelectItem></SelectContent></Select></div><div><Label htmlFor="doctor">Doctor</Label><Select><SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger><SelectContent><SelectItem value="dr-wilson">Dr. Sarah Wilson</SelectItem></SelectContent></Select></div></div><div className="grid grid-cols-2 gap-4"><div><Label htmlFor="date">Preferred Date</Label><Input type="date" /></div><div><Label htmlFor="time">Time Slot</Label><Select><SelectTrigger><SelectValue placeholder="Select time" /></SelectTrigger><SelectContent><SelectItem value="9am">9:00 AM</SelectItem></SelectContent></Select></div></div><div><Label htmlFor="reason">Reason for Visit</Label><Textarea placeholder="Brief description of your concern" /></div><div className="flex justify-end space-x-3"><Button variant="outline" onClick={() => setShowBookingModal(false)}>Cancel</Button><Button onClick={handleBookAppointment} className="healthcare-gradient">Book Appointment</Button></div></div></DialogContent></Dialog>
      
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Upload Medical Report</DialogTitle><DialogDescription>Upload your medical documents, reports, or prescriptions</DialogDescription></DialogHeader><div className="space-y-6"><div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"><FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" /><p className="text-lg font-medium text-gray-900 mb-2">{selectedFile ? selectedFile.name : "Drop files here or click to browse"}</p><p className="text-gray-600 mb-4">Supports PDF, JPG, PNG files up to 10MB</p><Input type="file" onChange={handleFileChange} className="hidden" id="file-upload" /><Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">Choose Files</Label></div><div className="flex justify-end space-x-3"><Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button><Button onClick={handleUploadReport} className="healthcare-gradient" disabled={!selectedFile}>Upload Report</Button></div></div></DialogContent></Dialog>

      <Dialog open={showEmergencyModal} onOpenChange={setShowEmergencyModal}><DialogContent className="max-w-md"><DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><AlertCircle className="w-6 h-6" />Emergency SOS</DialogTitle><DialogDescription>Are you sure you want to call emergency services?</DialogDescription></DialogHeader><div className="space-y-4"><div className="bg-red-50 p-4 rounded-lg"><p className="text-sm text-red-800">This will immediately contact emergency services and notify your emergency contacts.</p></div><div className="flex justify-end space-x-3"><Button variant="outline" onClick={() => setShowEmergencyModal(false)}>Cancel</Button><Button onClick={handleEmergencyCall} className="bg-red-600 hover:bg-red-700"><Phone className="w-4 h-4 mr-2" />Call Emergency</Button></div></div></DialogContent></Dialog>
    </>
  );
}