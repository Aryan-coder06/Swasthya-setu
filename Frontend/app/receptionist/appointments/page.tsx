"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Plus, Search, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface Doctor {
  id: number;
  firstName: string;
  lastName: string;
}

interface Appointment {
  id: number;
  patient_name: string;
  doctor_id: number;
  doctor?: { firstName: string; lastName: string };
  appointment_date: string;
  appointment_time: string;
  status: "confirmed" | "waiting" | "cancelled";
}

export default function ReceptionistAppointmentsPage() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  /* ------------------- FETCH APPOINTMENTS ------------------- */
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/receptionist/appointments/all`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load appointments");
      const data: Appointment[] = await res.json();
      setAppointments(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  /* ------------------- FETCH DOCTORS FROM SUPABASE ------------------- */
  const fetchDoctors = async () => {
    try {
      const res = await fetch(`${API_BASE}/receptionist/doctors/all`);
      if (!res.ok) throw new Error("Failed to load doctors");

      const data: Doctor[] = await res.json();
      setDoctors(data);
    } catch (err) {
      console.error("Doctor fetch error:", err);
      setDoctors([
        { id: 1, firstName: "Sarah", lastName: "Wilson" },
        { id: 2, firstName: "Michael", lastName: "Chen" },
      ]);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  /* ------------------- SEARCH FILTER ------------------- */
  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${apt.doctor?.firstName ?? ""} ${apt.doctor?.lastName ?? ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  /* ------------------- CREATE APPOINTMENT ------------------- */
  const handleNewAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);

    const form = new FormData(e.currentTarget);
    const patientName = (form.get("patientName") as string).trim();
    const doctorId = Number(form.get("doctor"));
    const date = form.get("date") as string;
    const time = form.get("time") as string;

    if (!patientName || !doctorId || !date || !time) {
      toast({ title: "Error", description: "All fields are required", variant: "destructive" });
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/receptionist/appointments/create`, {
        method: "POST144",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientName,  
          doctorId,
          date,
          time,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create appointment");

      await fetchAppointments();
      toast({ title: "Success", description: `Appointment for ${patientName} scheduled.` });
      setShowModal(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  /* ------------------- UPDATE STATUS ------------------- */
  const updateStatus = async (appointmentId: number, status: "confirmed" | "cancelled") => {
    try {
      const res = await fetch(`${API_BASE}/receptionist/appointments/update-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId, status }),
      });

      if (!res.ok) throw new Error((await res.json()).error);
      await fetchAppointments();
      toast({ title: "Updated", description: `Appointment ${status}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  /* ------------------- STATUS BADGE ------------------- */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case "waiting":
        return <Badge className="bg-yellow-100 text-yellow-800">Waiting</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Manage Appointments</h1>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAppointments} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule New Appointment</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleNewAppointment} className="space-y-4">
                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input id="patientName" name="patientName" placeholder="Enter name" required />
                </div>

                <div>
                  <Label htmlFor="doctor">Doctor</Label>
                  <Select name="doctor" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id.toString()}>
                          Dr. {doc.firstName} {doc.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" required />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" name="time" type="time" required />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={formLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      "Schedule"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by patient or doctor..."
              className="pl-10 w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : filteredAppointments.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No appointments found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell className="font-medium">APT{String(apt.id).padStart(3, "0")}</TableCell>
                    <TableCell>{apt.patient_name}</TableCell>
                    <TableCell>
                      Dr. {apt.doctor?.firstName} {apt.doctor?.lastName}
                    </TableCell>
                    <TableCell>{apt.appointment_date}</TableCell>
                    <TableCell>{apt.appointment_time.slice(0, 5)}</TableCell>
                    <TableCell>{getStatusBadge(apt.status)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      {apt.status === "waiting" && (
                        <Button
                          size="sm"
                          onClick={() => updateStatus(apt.id, "confirmed")}
                        >
                          Confirm
                        </Button>
                      )}
                      {apt.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(apt.id, "cancelled")}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Toaster />
    </motion.div>
  );
}