"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function ReceptionistAppointmentsPage() {
  const [appointments, setAppointments] = useState([
    { id: "APT001", patient: "John Smith", doctor: "Dr. Sarah Wilson", time: "09:30 AM", status: "confirmed" },
    { id: "APT002", patient: "Emma Johnson", doctor: "Dr. Michael Chen", time: "10:15 AM", status: "waiting" },
  ]);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const handleNewAppointment = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newAppointment = {
      id: `APT00${appointments.length + 1}`,
      patient: formData.get("patientName") as string || "N/A",
      doctor: formData.get("doctor") as string || "N/A",
      time: formData.get("time") as string || "N/A",
      status: "confirmed" as "confirmed",
    };
    setAppointments([...appointments, newAppointment]);
    setShowModal(false);
    toast({ title: "Appointment Scheduled", description: `Appointment for ${newAppointment.patient} has been added.` });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Manage Appointments</h1>
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-2" />New Appointment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Schedule a New Appointment</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleNewAppointment} className="space-y-4">
                  <div><Label htmlFor="patientName">Patient Name</Label><Input id="patientName" name="patientName" /></div>
                  <div>
                    <Label htmlFor="doctor">Doctor</Label>
                    <Select name="doctor">
                      <SelectTrigger><SelectValue placeholder="Select a doctor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dr. Sarah Wilson">Dr. Sarah Wilson</SelectItem>
                        <SelectItem value="Dr. Michael Chen">Dr. Michael Chen</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label htmlFor="time">Time</Label><Input id="time" name="time" type="time" /></div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit">Schedule</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
        </div>
        <Card>
            <CardHeader><div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><Input placeholder="Search by patient or doctor..." className="pl-10 w-full md:w-1/3" /></div></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Patient</TableHead><TableHead>Doctor</TableHead><TableHead>Time</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {appointments.map(apt => (
                            <TableRow key={apt.id}>
                                <TableCell className="font-medium">{apt.id}</TableCell>
                                <TableCell>{apt.patient}</TableCell>
                                <TableCell>{apt.doctor}</TableCell>
                                <TableCell>{apt.time}</TableCell>
                                <TableCell><Badge variant={apt.status === 'confirmed' ? 'default' : 'secondary'}>{apt.status}</Badge></TableCell>
                                <TableCell className="text-right"><Button variant="outline" size="sm">Details</Button></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <Toaster />
    </motion.div>
  )
}

