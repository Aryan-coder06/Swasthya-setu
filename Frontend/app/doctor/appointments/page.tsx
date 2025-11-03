"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Video,
  Plus,
  Search,
  Filter,
  Loader2,
  Clock4,
  Users2,
  MapPin,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useDoctorProfile } from "@/app/context/DoctorProfileContext";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRoute } from "@/config/env";

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

const STATUS_OPTIONS = ["all", "confirmed", "pending", "in-progress", "completed", "cancelled"];
const CHANNEL_OPTIONS = ["all", "Video Call", "In-Person"];
const NEW_PATIENT_VALUE = "__new_patient__";

const getStatusBadge = (status: string) => {
  const normalized = status.toLowerCase();
  switch (normalized) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-700";
    case "in-progress":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-slate-200 text-slate-800";
    case "pending":
      return "bg-amber-100 text-amber-800";
    case "cancelled":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const getChannelBadge = (channel: string) =>
  channel === "Video Call" ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700";

const sortByDateTime = (list: Appointment[]) =>
  [...list].sort((a, b) => {
    const dayA = `${a.appointmentDate ?? ""} ${a.appointmentTime ?? ""}`;
    const dayB = `${b.appointmentDate ?? ""} ${b.appointmentTime ?? ""}`;
    return dayA.localeCompare(dayB);
  });

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
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [timeframeFilter, setTimeframeFilter] = useState<string>("all");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientNameInput, setPatientNameInput] = useState("");

  const fetchAppointments = useCallback(async () => {
    if (!profileData.id) return;
    try {
      setLoading(true);
      const response = await axios.get<Appointment[]>(apiRoute(`/api/doctor/${profileData.id}/appointments`), {
        params: { t: Date.now() },
      });
      setAppointments(response.data ?? []);
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
      const response = await axios.get(apiRoute(`/api/doctor/${profileData.id}/patients`));
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

  const normalisedAppointments = useMemo(() => sortByDateTime(appointments), [appointments]);

  const today = new Date();
  const todayKey = today.toISOString().split("T")[0];
  const sevenDaysOut = new Date(today.getTime() + 7 * 86400000).toISOString().split("T")[0];

  const isFuture = useCallback(
    (appt: Appointment) => {
      if (!appt.appointmentDate) return false;
      return appt.appointmentDate >= todayKey;
    },
    [todayKey]
  );

  const upcomingAppointments = useMemo(
    () =>
      normalisedAppointments.filter(
        (appointment) => !["completed", "cancelled"].includes(appointment.status.toLowerCase()) && isFuture(appointment)
      ),
    [normalisedAppointments, isFuture]
  );

  const completedAppointments = useMemo(
    () =>
      normalisedAppointments.filter(
        (appointment) => appointment.status.toLowerCase() === "completed" || appointment.appointmentDate! < todayKey
      ),
    [normalisedAppointments, todayKey]
  );

  const stats = useMemo(() => {
    const totalUpcoming = upcomingAppointments.length;
    const totalCompleted = completedAppointments.length;
    const virtualUpcoming = upcomingAppointments.filter((appointment) => appointment.channel === "Video Call").length;
    const nextAppointment = upcomingAppointments[0] ?? null;
    return { totalUpcoming, totalCompleted, virtualUpcoming, nextAppointment };
  }, [upcomingAppointments, completedAppointments]);

  const filterAppointment = useCallback(
    (appointment: Appointment) => {
      const statusNormalized = appointment.status.toLowerCase();
      const channelNormalized = appointment.channel.toLowerCase();

      if (statusFilter !== "all" && statusNormalized !== statusFilter) return false;
      if (channelFilter !== "all" && channelNormalized !== channelFilter.toLowerCase()) return false;

    if (timeframeFilter === "today" && appointment.appointmentDate !== todayKey) return false;
    if (timeframeFilter === "next7") {
      const date = appointment.appointmentDate ?? "";
      if (!(date >= todayKey && date <= sevenDaysOut)) return false;
    }

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      if (
        !appointment.patientName.toLowerCase().includes(term) &&
        !(appointment.appointmentDate ?? "").includes(term) &&
        !(appointment.appointmentTime ?? "").includes(term)
      ) {
        return false;
      }
    }

      return true;
    },
    [channelFilter, searchTerm, statusFilter, timeframeFilter, todayKey, sevenDaysOut]
  );

  const filteredUpcoming = useMemo(
    () => upcomingAppointments.filter(filterAppointment),
    [upcomingAppointments, filterAppointment]
  );

  const filteredCompleted = useMemo(
    () => completedAppointments.filter(filterAppointment),
    [completedAppointments, filterAppointment]
  );

  const handleScheduleAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileData.id) return;
    setFormLoading(true);

    const formData = new FormData(e.currentTarget);
    const patientName = (formData.get("patientName") as string)?.trim();
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;
    const mode = formData.get("type") as "In-Person" | "Video Call";

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
      await axios.post(apiRoute(`/api/doctor/${profileData.id}/appointments`), {
        patientId: selectedPatientId,
        patientName: selectedPatientId ? undefined : patientName,
        appointmentDate: date,
        appointmentTime: time,
        mode: mode === "Video Call" ? "video" : "in-person",
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
      const response = await axios.post(apiRoute(`/api/doctor/appointments/${appointmentId}/create-meeting`));
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

  const handleUpdateStatus = async (appointmentId: number, status: string) => {
    try {
      await axios.patch(apiRoute(`/api/doctor/appointments/${appointmentId}`), { status });
      toast({ title: "Appointment updated", description: `Marked as ${status}.` });
      fetchAppointments();
    } catch (error: any) {
      console.error("Failed to update appointment", error);
      toast({
        title: "Unable to update",
        description: error.response?.data?.error || "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600">Track upcoming consultations, schedule follow-ups, and launch virtual visits.</p>
        </div>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule new appointment</DialogTitle>
              <DialogDescription>Link a patient and choose a time slot.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleScheduleAppointment} className="space-y-4">
              <div className="space-y-2">
                <Label>Select existing patient</Label>
                <Select
                  value={selectedPatientId ?? NEW_PATIENT_VALUE}
                  onValueChange={(value) => {
                    const resolved = value === NEW_PATIENT_VALUE ? null : value;
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
                    <SelectItem value={NEW_PATIENT_VALUE}>New patient</SelectItem>
                    {patients.map((patient) => {
                      if (!patient.id) return null;
                      return (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.fullName}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              {!selectedPatientId && (
                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient name</Label>
                  <Input
                    id="patientName"
                    name="patientName"
                    placeholder="e.g., Priya Sharma"
                    value={patientNameInput}
                    onChange={(event) => setPatientNameInput(event.target.value)}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input id="date" name="date" type="date" required min={todayKey} />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" name="time" type="time" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select name="type" defaultValue="In-Person">
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-Person">In person</SelectItem>
                    <SelectItem value="Video Call">Video call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Schedule
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUpcoming}</p>
            </div>
            <CalendarDays className="h-10 w-10 text-emerald-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Completed this month</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCompleted}</p>
            </div>
            <CheckCircle2 className="h-10 w-10 text-indigo-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Virtual visits</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.virtualUpcoming}</p>
            </div>
            <Video className="h-10 w-10 text-purple-600" />
          </CardContent>
        </Card>
      </div>

      {stats.nextAppointment && (
        <Card className="border-emerald-100 bg-emerald-50">
          <CardContent className="flex flex-col gap-2 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Clock4 className="h-9 w-9 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Next appointment</p>
                <p className="text-base text-emerald-900">
                  {stats.nextAppointment.patientName} · {stats.nextAppointment.appointmentDate} at{" "}
                  {stats.nextAppointment.appointmentTime}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusBadge(stats.nextAppointment.status)}>
                {stats.nextAppointment.status}
              </Badge>
              <Badge className={getChannelBadge(stats.nextAppointment.channel)}>
                {stats.nextAppointment.channel}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by patient or date..."
            className="pl-9"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Filters</p>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All statuses" : option.replace(/^\w/, (c) => c.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              {CHANNEL_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {option === "all" ? "All channels" : option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeframeFilter} onValueChange={setTimeframeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="next7">Next 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users2 className="w-5 h-5" />
              Appointment timeline
            </CardTitle>
            <Badge variant="outline" className="bg-slate-50">
              {filteredUpcoming.length + filteredCompleted.length} results
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming ({filteredUpcoming.length})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({filteredCompleted.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming" className="space-y-4 pt-4">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-20 w-full" />
                  ))}
                </div>
              ) : filteredUpcoming.length ? (
                filteredUpcoming.map((appointment) => {
                  const initials = appointment.patientName
                    .split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <Card key={appointment.id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback className="bg-indigo-100 text-indigo-600">{initials || "PT"}</AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">{appointment.patientName}</p>
                            <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {appointment.appointmentDate ?? "Not set"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock4 className="h-3.5 w-3.5" />
                                {appointment.appointmentTime ?? "TBD"}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {appointment.channel}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3 md:items-end">
                          <div className="flex flex-wrap gap-2">
                            <Badge className={getStatusBadge(appointment.status)}>{appointment.status}</Badge>
                            <Badge className={getChannelBadge(appointment.channel)}>{appointment.channel}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {appointment.channel === "Video Call" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStartCall(appointment.id)}
                                disabled={loadingMeetingId === appointment.id}
                              >
                                {loadingMeetingId === appointment.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…
                                  </>
                                ) : (
                                  <>
                                    <Video className="mr-2 h-4 w-4" /> Join Call
                                  </>
                                )}
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, "in-progress")}>
                                  Mark in progress
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, "completed")}>
                                  Mark completed
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(appointment.id, "cancelled")}>
                                  Cancel appointment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <p className="text-center text-muted-foreground py-8">No upcoming appointments with the selected filters.</p>
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
                    <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.appointmentDate} · {appointment.appointmentTime}
                        </p>
                      </div>
                      <Badge className={getStatusBadge(appointment.status)}>{appointment.status}</Badge>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">No completed appointments with the selected filters.</p>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Toaster />
    </motion.div>
  );
}
