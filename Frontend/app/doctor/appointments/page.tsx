"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Video, Plus, Search, Filter, Loader } from "lucide-react";
import axios from "axios";
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
import { useDoctorProfile } from "@/app/context/DoctorProfileContext";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Appointment {
  id: number;
  patientId: string | null;
  patientName: string;
  appointmentDate: string | null;
  appointmentTime: string | null;
  status: string;
  meetingLink: string | null;
  channel: string;
}

interface PatientOption {
  id: string | null;
  fullName: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "completed":
      return "bg-blue-100 text-blue-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function DoctorAppointmentsPage() {
  const { profileData } = useDoctorProfile();
  const { toast } = useToast();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [loadingMeetingId, setLoadingMeetingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientNameInput, setPatientNameInput] = useState("");

  const fetchAppointments = useCallback(async () => {
    if (!profileData.id) return;
    try {
      setLoading(true);
      const response = await axios.get<Appointment[]>(`${API_URL}/api/doctor/${profileData.id}/appointments`, {
        params: { t: Date.now() },
      });
      setAppointments(response.data);
    } catch (error: any) {
      console.error("Failed to fetch appointments", error);
      toast({
        title: "Unable to load appointments",
        description: error.response?.data?.error || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profileData.id, toast]);

  const fetchPatients = useCallback(async () => {
    if (!profileData.id) return;
    try {
      const response = await axios.get(`${API_URL}/api/doctor/${profileData.id}/patients`);
      const rawList = Array.isArray(response.data) ? response.data : [];
      const options: PatientOption[] = rawList
        .filter((patient: any) => !!patient.id)
        .map((patient: any) => ({
          id: patient.id,
          fullName: patient.fullName || `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim(),
        }));
      setPatients(options);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    }
  }, [profileData.id]);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, [fetchAppointments, fetchPatients]);

  const upcomingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status !== "completed" && appointment.status !== "cancelled"),
    [appointments]
  );

  const completedAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.status === "completed"),
    [appointments]
  );

  const filteredUpcoming = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return upcomingAppointments;
    return upcomingAppointments.filter((appointment) =>
      appointment.patientName.toLowerCase().includes(term) ||
      (appointment.appointmentDate ?? "").toLowerCase().includes(term)
    );
  }, [searchTerm, upcomingAppointments]);

  const filteredCompleted = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return completedAppointments;
    return completedAppointments.filter((appointment) =>
      appointment.patientName.toLowerCase().includes(term)
    );
  }, [searchTerm, completedAppointments]);

  const handleScheduleAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileData.id) return;
    setFormLoading(true);

    const formData = new FormData(e.currentTarget);
    const patientName = (formData.get("patientName") as string)?.trim();
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const type = formData.get("type") as "In-Person" | "Video Call" | null;

    if (!selectedPatientId && !patientName) {
      toast({
        title: "Missing patient",
        description: "Select an existing patient or provide a name.",
        variant: "destructive",
      });
      setFormLoading(false);
      return;
    }

    if (!date || !time) {
      toast({
        title: "Incomplete details",
        description: "Please provide both date and time.",
        variant: "destructive",
      });
      setFormLoading(false);
      return;
    }

    try {
      await axios.post(`${API_URL}/api/doctor/${profileData.id}/appointments`, {
        patientId: selectedPatientId,
        patientName: selectedPatientId ? undefined : patientName,
        appointmentDate: date,
        appointmentTime: time,
        mode: type === "Video Call" ? "video" : "in-person",
      });

      toast({ title: "Appointment scheduled" });
      setShowModal(false);
      setSelectedPatientId(null);
      setPatientNameInput("");
      e.currentTarget.reset();
      fetchAppointments();
    } catch (error: any) {
      console.error("Failed to schedule appointment", error);
      toast({
        title: "Unable to schedule",
        description: error.response?.data?.error || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleStartCall = async (appointmentId: number) => {
    setLoadingMeetingId(appointmentId);
    toast({ title: "Generating meeting", description: "Creating a secure session..." });

    try {
      const response = await axios.post(`${API_URL}/api/doctor/appointments/${appointmentId}/create-meeting`);
      const { meetingLink } = response.data;

      if (meetingLink) {
        window.open(meetingLink, "_blank");
        fetchAppointments();
        toast({ title: "Meeting link ready", description: "Opened in a new tab." });
      } else {
        throw new Error("No meeting link received.");
      }
    } catch (error: any) {
      console.error("Error creating meeting link", error);
      toast({
        title: "Meeting link failed",
        description: error.response?.data?.error || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingMeetingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
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
              <DialogDescription>Link your patient and set a time slot.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleScheduleAppointment} className="space-y-4">
              <div className="space-y-2">
                <Label>Select existing patient</Label>
                <Select
                  value={selectedPatientId ?? ""}
                  onValueChange={(value) => {
                    const resolved = value || null;
                    setSelectedPatientId(resolved);
                    if (resolved) {
                      const selected = patients.find((patient) => patient.id === resolved);
                      setPatientNameInput(selected?.fullName ?? "");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={patients.length ? "Choose patient" : "No patients found"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">New patient</SelectItem>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id ?? patient.fullName} value={patient.id ?? ""}>
                        {patient.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  id="patientName"
                  name="patientName"
                  placeholder="e.g., John Doe"
                  value={patientNameInput}
                  onChange={(event) => {
                    setSelectedPatientId(null);
                    setPatientNameInput(event.target.value);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" required />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" name="time" type="time" required />
                </div>
              </div>
              <div>
                <Label htmlFor="type">Appointment Type</Label>
                <Select name="type" defaultValue="In-Person">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                    <SelectItem value="Video Call">Video Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}Schedule
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search appointments..."
                className="pl-10 w-64"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <Button variant="outline" onClick={fetchAppointments} disabled={loading}>
              <Filter className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-4 pt-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredUpcoming.length ? (
                filteredUpcoming.map((appointment) => (
                  <Card key={appointment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {appointment.patientName
                              .split(" ")
                              .map((part) => part[0])
                              .join("")
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{appointment.patientName}</h3>
                          <p className="text-sm text-gray-600">{appointment.appointmentDate ?? "Not set"}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="font-medium text-sm">Type</p>
                          <Badge variant={appointment.channel === "Video Call" ? "default" : "secondary"}>
                            {appointment.channel}
                          </Badge>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-sm">Time</p>
                          <p className="text-gray-800">{appointment.appointmentTime || "TBD"}</p>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartCall(appointment.id)}
                          disabled={loadingMeetingId === appointment.id}
                        >
                          {loadingMeetingId === appointment.id ? (
                            <>
                              <Loader className="w-4 h-4 mr-2 animate-spin" /> Creating...
                            </>
                          ) : (
                            <>
                              <Video className="w-4 h-4 mr-2" /> Start Call
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No upcoming appointments to show.
                </p>
              )}
            </TabsContent>
            <TabsContent value="completed" className="space-y-4 pt-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredCompleted.length ? (
                filteredCompleted.map((appointment) => (
                  <Card key={appointment.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{appointment.patientName}</p>
                        <p className="text-sm text-gray-500">
                          {appointment.appointmentDate} at {appointment.appointmentTime}
                        </p>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>{appointment.status}</Badge>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No completed appointments to show.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Toaster />
    </motion.div>
  );
}
