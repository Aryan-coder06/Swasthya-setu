"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Video, Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState([
    { id: 1, patient: "Emma Johnson", time: "09:00 AM", status: "confirmed", condition: "Hypertension", avatar: "EJ", type: "In-Person", date: "2025-10-08" },
    { id: 2, patient: "Michael Smith", time: "10:30 AM", status: "completed", condition: "Diabetes", avatar: "MS", type: "Video Call", date: "2025-10-08" },
  ]);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const handleScheduleAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAppointment = {
      id: appointments.length + 1,
      patient: formData.get("patientName") as string || "New Patient",
      time: formData.get("time") as string || "12:00 PM",
      status: "confirmed" as "confirmed",
      condition: "New Consultation",
      avatar: "NP",
      type: formData.get("type") as "In-Person" | "Video Call",
      date: formData.get("date") as string || new Date().toISOString().split('T')[0],
    };
    setAppointments([...appointments, newAppointment]);
    setShowModal(false);
    toast({ title: "Success", description: "New appointment has been scheduled." });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>Fill in the details to add a new appointment to your schedule.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleScheduleAppointment} className="space-y-4">
              <div>
                <Label htmlFor="patientName">Patient Name</Label>
                <Input id="patientName" name="patientName" placeholder="e.g., John Doe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="date">Date</Label><Input id="date" name="date" type="date" /></div>
                <div><Label htmlFor="time">Time</Label><Input id="time" name="time" type="time" /></div>
              </div>
               <div>
                  <Label htmlFor="type">Appointment Type</Label>
                  <Select name="type">
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="In-Person">In-Person</SelectItem>
                      <SelectItem value="Video Call">Video Call</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Schedule</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><Input placeholder="Search appointments..." className="pl-10 w-64" /></div>
              <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-4 pt-4">
              {appointments.filter(a => a.status !== 'completed').map((appointment) => (
                <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar><AvatarFallback className="bg-blue-100 text-blue-600">{appointment.avatar}</AvatarFallback></Avatar>
                      <div>
                        <h3 className="font-semibold">{appointment.patient}</h3>
                        <p className="text-sm text-gray-600">{appointment.condition}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                       <div className="text-center"><p className="font-medium text-sm">Type</p><Badge variant={appointment.type === 'Video Call' ? 'default' : 'secondary'}>{appointment.type}</Badge></div>
                       <div className="text-center"><p className="font-medium text-sm">Time</p><p className="text-gray-800">{appointment.time}</p></div>
                      <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
             <TabsContent value="completed" className="space-y-4 pt-4">
                {appointments.filter(a => a.status === 'completed').length > 0 ? appointments.filter(a => a.status === 'completed').map((appointment) => (
                    <Card key={appointment.id}><CardContent className="p-4">{appointment.patient}</CardContent></Card>
                )) : <p className="text-center text-gray-500 py-8">No completed appointments to show.</p>}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Toaster />
    </motion.div>
  );
}

