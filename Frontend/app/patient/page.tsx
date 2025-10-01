"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Heart,
  FileText,
  MapPin,
  Phone,
  User,
  Activity,
  Bell,
  Search,
  Plus,
  Settings,
  LogOut,
  Stethoscope,
  Shield,
  CreditCard,
  Users,
  AlertCircle,
  CheckCircle,
  Star,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function PatientDashboard() {
  const [selectedMenu, setSelectedMenu] = useState("dashboard");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "Appointment confirmed with Dr. Sarah Wilson", time: "2 hours ago", type: "appointment" },
    { id: 2, message: "Lab results are ready for download", time: "1 day ago", type: "report" },
    { id: 3, message: "Prescription refill reminder", time: "2 days ago", type: "prescription" }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Hardcoded userId for demonstration; in real app, get from auth
  const userId = "test-user-id";

  // State for uploaded file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Activity },
    { id: "appointments", label: "Appointments", icon: Calendar, route: "/patient/appointments" },
    { id: "records", label: "Medical Records", icon: FileText, route: "/patient/records" },
    { id: "hospitals", label: "Find Hospitals", icon: MapPin, route: "/patient/hospitals" },
    { id: "consultations", label: "AI Consultations", icon: Stethoscope, route: "/patient/ai-consultation" },
    { id: "family", label: "Family Members", icon: Users, route: "/patient/family" },
    { id: "billing", label: "Billing", icon: CreditCard, route: "/patient/billing" },
    { id: "emergency", label: "Emergency SOS", icon: AlertCircle, route: "/patient/emergency" }
  ];

  const upcomingAppointments = [
    {
      id: 1,
      doctor: "Dr. Sarah Wilson",
      specialty: "Cardiologist",
      date: "Tomorrow",
      time: "2:00 PM",
      type: "Follow-up",
      status: "confirmed"
    },
    {
      id: 2,
      doctor: "Dr. Michael Chen",
      specialty: "General Medicine",
      date: "Dec 28",
      time: "10:30 AM",
      type: "Regular Checkup",
      status: "pending"
    }
  ];

  const healthMetrics = [
    { label: "Blood Pressure", value: "120/80", status: "normal", color: "text-green-600" },
    { label: "Heart Rate", value: "72 BPM", status: "normal", color: "text-green-600" },
    { label: "Weight", value: "68 kg", status: "stable", color: "text-blue-600" },
    { label: "BMI", value: "22.5", status: "healthy", color: "text-green-600" }
  ];

  const recentActivities = [
    { type: "appointment", message: "Appointment confirmed with Dr. Sarah Wilson", time: "2 hours ago" },
    { type: "report", message: "Lab results uploaded - Blood Test", time: "1 day ago" },
    { type: "prescription", message: "New prescription from Dr. Michael Chen", time: "3 days ago" },
    { type: "payment", message: "Payment successful - ₹1,500", time: "1 week ago" }
  ];

  const handleMenuClick = (item: any) => {
    if (item.route) {
      router.push(item.route);
    } else {
      setSelectedMenu(item.id);
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case "book-appointment":
        setShowBookingModal(true);
        break;
      case "upload-report":
        setShowUploadModal(true);
        break;
      case "ai-consultation":
        router.push("/patient/ai-consultation");
        break;
      case "emergency":
        setShowEmergencyModal(true);
        break;
    }
  };

  const handleBookAppointment = () => {
    toast({
      title: "Appointment Booked!",
      description: "Your appointment has been successfully scheduled.",
    });
    setShowBookingModal(false);
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

    const formData = new FormData();
    formData.append("document", selectedFile);
    formData.append("userId", userId);

    try {
      const response = await axios.post("http://localhost:5000/profile/docs/add_doc", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast({
        title: "Report Uploaded!",
        description: "Your medical report has been successfully uploaded.",
      });
      setSelectedFile(null);
      setShowUploadModal(false);
    } catch (error: any) {
      console.error("Upload error:", error); // Debug
      toast({
        title: "Upload Failed",
        description: error.response?.data?.docError || "Failed to upload report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleEmergencyCall = () => {
    toast({
      title: "Emergency Alert Sent!",
      description: "Emergency services have been contacted.",
    });
    setShowEmergencyModal(false);
    router.push("/patient/emergency");
  };

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

  const renderDashboard = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-blue-500 to-green-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Good Morning, John!</h2>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Button 
                className="h-20 flex-col space-y-2"
                onClick={() => handleQuickAction("book-appointment")}
              >
                <Calendar className="w-6 h-6" />
                <span>Book Appointment</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => handleQuickAction("upload-report")}
              >
                <FileText className="w-6 h-6" />
                <span>Upload Report</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2"
                onClick={() => handleQuickAction("ai-consultation")}
              >
                <Stethoscope className="w-6 h-6" />
                <span>AI Consultation</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleQuickAction("emergency")}
              >
                <AlertCircle className="w-6 h-6" />
                <span>Emergency</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Health Metrics & Appointments */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Health Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {healthMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{metric.label}</div>
                    <div className="text-sm text-gray-600 capitalize">{metric.status}</div>
                  </div>
                  <div className={`text-lg font-bold ${metric.color}`}>
                    {metric.value}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>{appointment.doctor.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{appointment.doctor}</div>
                      <div className="text-sm text-gray-600">{appointment.specialty}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{appointment.date}</div>
                    <div className="text-sm text-gray-600">{appointment.time}</div>
                    <Badge className={appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {appointment.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Appointments
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activities */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {activity.type === 'appointment' && <Calendar className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'report' && <FileText className="w-4 h-4 text-green-600" />}
                    {activity.type === 'prescription' && <Stethoscope className="w-4 h-4 text-purple-600" />}
                    {activity.type === 'payment' && <CreditCard className="w-4 h-4 text-orange-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{activity.message}</div>
                    <div className="text-sm text-gray-600">{activity.time}</div>
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
            <Badge variant="outline">Patient Portal</Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input placeholder="Search..." className="pl-10 w-64" />
            </div>
            <Button 
              size="icon" 
              variant="outline" 
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </Button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-16 right-0 w-80 bg-white border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="p-3 border-b hover:bg-gray-50">
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
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
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    selectedMenu === item.id
                      ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
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
        </main>
      </div>
      
      {/* Modals */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
            <DialogDescription>
              Schedule an appointment with your preferred doctor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardiology">Cardiology</SelectItem>
                    <SelectItem value="general">General Medicine</SelectItem>
                    <SelectItem value="dermatology">Dermatology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="doctor">Doctor</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dr-wilson">Dr. Sarah Wilson</SelectItem>
                    <SelectItem value="dr-chen">Dr. Michael Chen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Preferred Date</Label>
                <Input type="date" />
              </div>
              <div>
                <Label htmlFor="time">Time Slot</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="9am">9:00 AM</SelectItem>
                    <SelectItem value="10am">10:00 AM</SelectItem>
                    <SelectItem value="2pm">2:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason for Visit</Label>
              <Textarea placeholder="Brief description of your concern" />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowBookingModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleBookAppointment} className="healthcare-gradient">
                Book Appointment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Medical Report</DialogTitle>
            <DialogDescription>
              Upload your medical documents, reports, or prescriptions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-gray-600 mb-4">
                Supports PDF, JPG, PNG files up to 10MB
              </p>
              <Input type="file" onChange={handleFileChange} className="mx-auto w-64" />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUploadReport} className="healthcare-gradient">
                Upload Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showEmergencyModal} onOpenChange={setShowEmergencyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Emergency SOS
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to call emergency services?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">
                This will immediately contact emergency services and notify your emergency contacts.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowEmergencyModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleEmergencyCall} className="bg-red-600 hover:bg-red-700">
                <Phone className="w-4 h-4 mr-2" />
                Call Emergency
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Toaster />
    </div>
  );
}