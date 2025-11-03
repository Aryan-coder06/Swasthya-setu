"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Loader2, RefreshCw } from "lucide-react";
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
import { API_BASE_URL } from "@/config/env";

type AppointmentStatus =
  | "confirmed"
  | "pending"
  | "waiting"
  | "in-progress"
  | "completed"
  | "cancelled";

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone_no?: string | null;
}

interface Appointment {
  id: string | number;
  patient_id: string | null;
  patient_name: string | null;
  doctor_id: string;
  doctor_name: string | null;
  appointment_date: string;
  appointment_time: string;
  status: AppointmentStatus;
  doctor?: {
    id?: string;
    firstName?: string;
    lastName?: string;
  };
  patient?: {
    id?: string;
    firstName?: string;
    lastName?: string;
  };
}

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  confirmed: "Confirmed",
  pending: "Pending",
  waiting: "Waiting",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  confirmed: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  waiting: "bg-yellow-100 text-yellow-800",
  "in-progress": "bg-sky-100 text-sky-800",
  completed: "bg-gray-200 text-gray-700",
  cancelled: "bg-rose-100 text-rose-800",
};

const FORM_STATUS_OPTIONS: AppointmentStatus[] = ["confirmed", "pending"];
const TABLE_STATUS_OPTIONS: AppointmentStatus[] = [
  "confirmed",
  "pending",
  "waiting",
  "in-progress",
  "completed",
  "cancelled",
];
const NEW_PATIENT_VALUE = "new-patient";

const buildFullName = (first?: string | null, last?: string | null) =>
  [first ?? "", last ?? ""].join(" ").trim();

const extractPatientName = (appointment: Appointment) =>
  appointment.patient_name ||
  buildFullName(
    appointment.patient?.firstName,
    appointment.patient?.lastName
  ) ||
  "Unknown patient";

const extractDoctorName = (appointment: Appointment) =>
  appointment.doctor_name ||
  buildFullName(
    appointment.doctor?.firstName,
    appointment.doctor?.lastName
  ) ||
  "Unknown doctor";

const formatAppointmentId = (id: string | number) => {
  const stringified = id.toString();
  if (/^\d+$/.test(stringified)) {
    return `APT${stringified.padStart(3, "0")}`;
  }
  return `${stringified.slice(0, 4)}…${stringified.slice(-4)}`;
};

export default function ReceptionistAppointmentsPage() {
  const API_BASE = API_BASE_URL;

  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const [selectedPatientId, setSelectedPatientId] = useState<string>(
    NEW_PATIENT_VALUE
  );
  const [patientNameInput, setPatientNameInput] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentStatus, setAppointmentStatus] =
    useState<AppointmentStatus>("confirmed");

  const resetForm = () => {
    setSelectedPatientId(NEW_PATIENT_VALUE);
    setPatientNameInput("");
    setSelectedDoctorId("");
    setAppointmentDate("");
    setAppointmentTime("");
    setAppointmentStatus("confirmed");
  };

  /* ------------------- FETCH APPOINTMENTS ------------------- */
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/receptionist/appointments/all`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to load appointments");
      }
      const data: Appointment[] = await res.json();
      setAppointments(data);
    } catch (err: any) {
      console.error("Appointments fetch error:", err);
      toast({
        title: "Error loading appointments",
        description: err.message ?? "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [API_BASE, toast]);

  /* ------------------- FETCH DOCTORS & PATIENTS ------------------- */
  const fetchDoctors = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/receptionist/doctors/all`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to load doctors");
      }
      const data: Doctor[] = await res.json();
      setDoctors(data);
    } catch (err: any) {
      console.error("Doctor fetch error:", err);
      toast({
        title: "Doctor directory unavailable",
        description: err.message ?? "Fetched zero doctors from Supabase.",
        variant: "destructive",
      });
      setDoctors([]);
    }
  }, [API_BASE, toast]);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/receptionist/patients/all`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to load patients");
      }
      const data: Patient[] = await res.json();
      setPatients(data);
    } catch (err: any) {
      console.error("Patient fetch error:", err);
      toast({
        title: "Patient directory unavailable",
        description: err.message ?? "Fetched zero patients from Supabase.",
        variant: "destructive",
      });
      setPatients([]);
    }
  }, [API_BASE, toast]);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchPatients();
  }, [fetchAppointments, fetchDoctors, fetchPatients]);

  /* ------------------- FILTERED LIST ------------------- */
  const filteredAppointments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return appointments;

    return appointments.filter((apt) => {
      const patientName = extractPatientName(apt).toLowerCase();
      const doctorName = extractDoctorName(apt).toLowerCase();
      const idText = apt.id.toString().toLowerCase();
      return (
        patientName.includes(term) ||
        doctorName.includes(term) ||
        idText.includes(term)
      );
    });
  }, [appointments, searchTerm]);

  /* ------------------- FORM HELPERS ------------------- */
  const handlePatientSelect = (value: string) => {
    setSelectedPatientId(value);
    if (value === NEW_PATIENT_VALUE) {
      setPatientNameInput("");
      return;
    }

    const selected = patients.find((patient) => patient.id === value);
    setPatientNameInput(
      buildFullName(selected?.firstName ?? "", selected?.lastName ?? "")
    );
  };

  const handleNewAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);

    if (!selectedDoctorId) {
      toast({
        title: "Doctor required",
        description: "Please choose a doctor for the appointment.",
        variant: "destructive",
      });
      setFormLoading(false);
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      toast({
        title: "Date & time required",
        description: "Please choose both date and time for the appointment.",
        variant: "destructive",
      });
      setFormLoading(false);
      return;
    }

    const trimmedName = patientNameInput.trim();
    const patientIdPayload =
      selectedPatientId === NEW_PATIENT_VALUE ? null : selectedPatientId;

    if (!patientIdPayload && !trimmedName) {
      toast({
        title: "Patient name required",
        description: "Provide a patient name or pick an existing patient.",
        variant: "destructive",
      });
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/receptionist/appointments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientIdPayload,
          patientName: trimmedName || null,
          doctorId: selectedDoctorId,
          date: appointmentDate,
          time: appointmentTime,
          status: appointmentStatus,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to create appointment");
      }

      await fetchAppointments();
      toast({
        title: "Appointment scheduled",
        description:
          payload?.data?.patient_name ||
          trimmedName ||
          "Appointment created successfully.",
      });
      setShowModal(false);
      resetForm();
    } catch (err: any) {
      toast({
        title: "Unable to create appointment",
        description: err.message ?? "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const updateStatus = async (
    appointmentId: string | number,
    status: AppointmentStatus
  ) => {
    try {
      const res = await fetch(
        `${API_BASE}/receptionist/appointments/update-status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointmentId, status }),
        }
      );

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.error || "Failed to update status");
      }

      await fetchAppointments();
      toast({
        title: "Status updated",
        description: `Appointment marked as ${STATUS_LABELS[status]}.`,
      });
    } catch (err: any) {
      toast({
        title: "Unable to update status",
        description: err.message ?? "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => (
    <Badge className={STATUS_STYLES[status] ?? "bg-gray-200 text-gray-700"}>
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Book new slots, link patients, and keep the doctor&apos;s calendar tidy.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAppointments} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={showModal} onOpenChange={(open) => {
            setShowModal(open);
            if (!open) resetForm();
          }}>
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
                <div className="space-y-2">
                  <Label htmlFor="patient">Patient</Label>
                  <Select value={selectedPatientId} onValueChange={handlePatientSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing patient" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NEW_PATIENT_VALUE}>+ New patient</SelectItem>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {buildFullName(patient.firstName, patient.lastName) ||
                            patient.phone_no ||
                            patient.id.slice(0, 8)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={patientNameInput}
                    onChange={(event) => setPatientNameInput(event.target.value)}
                    placeholder="Enter patient full name"
                    required={selectedPatientId === NEW_PATIENT_VALUE}
                  />
                </div>

                <div>
                  <Label htmlFor="doctor">Doctor</Label>
                  <Select
                    value={selectedDoctorId}
                    onValueChange={setSelectedDoctorId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          Dr. {buildFullName(doc.firstName, doc.lastName)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={appointmentDate}
                      onChange={(event) => setAppointmentDate(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      value={appointmentTime}
                      onChange={(event) => setAppointmentTime(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Initial Status</Label>
                  <Select
                    value={appointmentStatus}
                    onValueChange={(value) =>
                      setAppointmentStatus(value as AppointmentStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick status" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORM_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={formLoading}
                  >
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
              placeholder="Search by patient, doctor, or appointment ID..."
              className="pl-10 w-full md:w-1/2"
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
            <p className="text-center py-8 text-gray-500">
              No appointments match the current filter.
            </p>
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
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell className="font-medium">
                      {formatAppointmentId(apt.id)}
                    </TableCell>
                    <TableCell>{extractPatientName(apt)}</TableCell>
                    <TableCell>{extractDoctorName(apt)}</TableCell>
                    <TableCell>{apt.appointment_date}</TableCell>
                    <TableCell>
                      {apt.appointment_time
                        ? apt.appointment_time.slice(0, 5)
                        : "--:--"}
                    </TableCell>
                    <TableCell>{getStatusBadge(apt.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Select
                          value={apt.status}
                          onValueChange={(value) =>
                            updateStatus(apt.id, value as AppointmentStatus)
                          }
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Set status" />
                          </SelectTrigger>
                          <SelectContent>
                            {TABLE_STATUS_OPTIONS.map((status) => (
                              <SelectItem key={status} value={status}>
                                {STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatus(apt.id, "cancelled")}
                          disabled={apt.status === "cancelled"}
                        >
                          Cancel
                        </Button>
                      </div>
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
