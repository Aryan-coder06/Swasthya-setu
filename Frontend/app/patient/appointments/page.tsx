"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Plus,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useProfile } from "@/app/context/ProfileContext";
import { API_BASE_URL } from "@/config/env";

const API_URL = API_BASE_URL;
const SLOT_DURATION_MINUTES = 15;
const WORKING_HOURS = { start: 9, end: 17 } as const;
const ACTIVE_APPOINTMENT_STATUSES = ["confirmed", "pending", "in-progress"];

interface Appointment {
  id: string;
  doctorId: string | null;
  doctorName: string;
  doctorSpecialty?: string | null;
  hospitalName?: string | null;
  appointmentDate: string;
  appointmentTime: string;
  startAt: string | null;
  endAt: string | null;
  durationMinutes: number;
  status: string;
  meetingLink?: string | null;
}

interface DoctorOption {
  id: string;
  name: string;
  specialty?: string | null;
  hospitalName?: string | null;
}

const pad = (value: number) => value.toString().padStart(2, "0");

const toDisplayTime = (time24: string) => {
  if (!time24) return "--";
  const [hourRaw, minuteRaw] = time24.split(":");
  const hours = Number(hourRaw);
  const minutes = Number(minuteRaw ?? "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${pad(minutes)} ${suffix}`;
};

const parseTimeToMinutes = (time24: string) => {
  const [hourRaw, minuteRaw] = time24.split(":");
  return Number(hourRaw) * 60 + Number(minuteRaw ?? "0");
};

const generateDailySlots = () => {
  const slots: string[] = [];
  const startMinutes = WORKING_HOURS.start * 60;
  const endMinutes = WORKING_HOURS.end * 60;
  for (let minute = startMinutes; minute <= endMinutes - SLOT_DURATION_MINUTES; minute += SLOT_DURATION_MINUTES) {
    const hours = Math.floor(minute / 60);
    const minutes = minute % 60;
    slots.push(`${pad(hours)}:${pad(minutes)}`);
  }
  return slots;
};

const getDateKey = (date: Date) => date.toISOString().split("T")[0];

const formatDateReadable = (dateString: string) => {
  if (!dateString) return "--";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("en-IN", { month: "long", day: "numeric", year: "numeric" });
};

const formatTimeFromIso = (iso?: string | null) => {
  if (!iso) return "--";
  const date = new Date(iso);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};

const ALL_SLOTS = generateDailySlots();

export default function AppointmentsPage() {
  const { toast } = useToast();
  const { profileData } = useProfile();

  const patientId = profileData.id;

  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [doctorOptions, setDoctorOptions] = useState<DoctorOption[]>([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const todayKey = useMemo(() => getDateKey(new Date()), []);
  const activeStatusSet = useMemo(() => new Set(ACTIVE_APPOINTMENT_STATUSES), []);

  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  const fetchAppointments = useCallback(async () => {
    if (!patientId) return;
    setAppointmentsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/patient/appointments/list`, { patientId });
      const mapped: Appointment[] = Array.isArray(response.data?.data)
        ? response.data.data.map((item: any) => {
            const doctorName =
              item?.doctor?.fullName ||
              `${item?.doctor?.firstName ?? ""} ${item?.doctor?.lastName ?? ""}`.trim() ||
              "Doctor";
            return {
              id: String(item.id ?? crypto.randomUUID()),
              doctorId: item.doctorId ?? item.doctor?.id ?? null,
              doctorName,
              doctorSpecialty: item.doctor?.specialty ?? item.doctor?.specs ?? null,
              hospitalName: item.doctor?.hospitalName ?? null,
              appointmentDate: item.appointmentDate,
              appointmentTime: item.appointmentTime,
              startAt: item.startAt ?? null,
              endAt: item.endAt ?? null,
              durationMinutes: item.durationMinutes ?? SLOT_DURATION_MINUTES,
              status: item.status ?? "pending",
              meetingLink: item.meetingLink ?? null,
            };
          })
        : [];

      setAppointments(mapped);
    } catch (error) {
      console.error("Failed to load appointments:", error);
      toast({
        title: "Unable to load appointments",
        description: "Please try again after a moment.",
        variant: "destructive",
      });
    } finally {
      setAppointmentsLoading(false);
    }
  }, [patientId, toast]);

  const fetchDoctorDirectory = useCallback(async () => {
    setDoctorLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/doctor/directory/list`, { params: { limit: 200 } });
      const data: DoctorOption[] = Array.isArray(response.data?.data)
        ? response.data.data.map((doctor: any) => ({
            id: String(doctor.id),
            name:
              doctor.fullName ||
              `${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim() ||
              "Doctor",
            specialty: doctor.specialty ?? null,
            hospitalName: doctor.hospitalName ?? null,
          }))
        : [];
      setDoctorOptions(data);
    } catch (error) {
      console.error("Failed to load doctors:", error);
      toast({
        title: "Unable to load doctors",
        description: "Doctor list could not be refreshed.",
        variant: "destructive",
      });
    } finally {
      setDoctorLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (patientId) {
      fetchAppointments();
    }
  }, [patientId, fetchAppointments]);

  useEffect(() => {
    fetchDoctorDirectory();
  }, [fetchDoctorDirectory]);

  useEffect(() => {
    if (!selectedDoctorId || !selectedDate) {
      setAvailableSlots([]);
      setSelectedSlot("");
      return;
    }

    const loadSlots = async () => {
      setFetchingSlots(true);
      try {
        const response = await axios.get(`${API_URL}/api/doctor/${selectedDoctorId}/appointments`, {
          params: { date: selectedDate },
        });
        const sameDayAppointments: Appointment[] = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

        const windows = sameDayAppointments
          .filter((appt) => activeStatusSet.has(appt.status))
          .map((appt) => {
            const startDate = appt.startAt
              ? new Date(appt.startAt)
              : new Date(`${appt.appointmentDate}T${appt.appointmentTime || "00:00"}`);
            const endDate = appt.endAt
              ? new Date(appt.endAt)
              : new Date(startDate.getTime() + (appt.durationMinutes ?? SLOT_DURATION_MINUTES) * 60000);
            return {
              startMinutes: startDate.getHours() * 60 + startDate.getMinutes(),
              endMinutes: endDate.getHours() * 60 + endDate.getMinutes(),
            };
          });

        const isSelectedDateToday = selectedDate === todayKey;
        const nowMinutes = (() => {
          const now = new Date();
          return now.getHours() * 60 + now.getMinutes();
        })();

        const slots = ALL_SLOTS.filter((slot) => {
          const slotMinutes = parseTimeToMinutes(slot);
          if (isSelectedDateToday && slotMinutes <= nowMinutes) {
            return false;
          }
          return !windows.some(
            (window) => slotMinutes >= window.startMinutes && slotMinutes < window.endMinutes
          );
        });

        setAvailableSlots(slots);
        setSelectedSlot((prev) => (slots.includes(prev) ? prev : slots[0] ?? ""));
      } catch (error) {
        console.error("Failed to load slots:", error);
        toast({
          title: "Unable to load slots",
          description: "Please try a different doctor or date.",
          variant: "destructive",
        });
        setAvailableSlots([]);
        setSelectedSlot("");
      } finally {
        setFetchingSlots(false);
      }
    };

    loadSlots();
  }, [selectedDoctorId, selectedDate, todayKey, activeStatusSet, toast]);

  useEffect(() => {
    if (showBookingModal) {
      setSelectedDate((prev) => prev || todayKey);
    } else {
      setSelectedDoctorId("");
      setSelectedDate("");
      setSelectedSlot("");
      setAvailableSlots([]);
    }
  }, [showBookingModal, todayKey]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const aTime = new Date(a.startAt ?? `${a.appointmentDate}T${a.appointmentTime || "00:00"}`);
      const bTime = new Date(b.startAt ?? `${b.appointmentDate}T${b.appointmentTime || "00:00"}`);
      return aTime.getTime() - bTime.getTime();
    });
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    if (!searchTerm.trim()) return sortedAppointments;
    const term = searchTerm.toLowerCase();
    return sortedAppointments.filter(
      (appointment) =>
        appointment.doctorName.toLowerCase().includes(term) ||
        (appointment.hospitalName ?? "").toLowerCase().includes(term) ||
        appointment.status.toLowerCase().includes(term)
    );
  }, [sortedAppointments, searchTerm]);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    appointments.forEach((appointment) => {
      const key = appointment.appointmentDate;
      const current = map.get(key) ?? [];
      current.push(appointment);
      map.set(key, current);
    });
    return map;
  }, [appointments]);

  const calendarCells = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leadingBlanks = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const totalCells = Math.ceil((leadingBlanks + totalDays) / 7) * 7;
    const cells: Array<{
      date: Date | null;
      label: string;
      key: string;
      appointments: Appointment[];
      isToday: boolean;
      inMonth: boolean;
    }> = [];

    for (let index = 0; index < totalCells; index++) {
      const dayNumber = index - leadingBlanks + 1;
      if (dayNumber < 1 || dayNumber > totalDays) {
        cells.push({
          date: null,
          label: "",
          key: `blank-${index}`,
          appointments: [],
          isToday: false,
          inMonth: false,
        });
        continue;
      }
      const date = new Date(year, month, dayNumber);
      const key = getDateKey(date);
      cells.push({
        date,
        label: String(dayNumber),
        key,
        appointments: appointmentsByDate.get(key) ?? [],
        isToday: key === todayKey,
        inMonth: true,
      });
    }

    return cells;
  }, [currentMonth, appointmentsByDate, todayKey]);

  const handleBookAppointment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patientId) {
      toast({
        title: "Profile incomplete",
        description: "Sign in again to refresh your profile before booking.",
        variant: "destructive",
      });
      return;
    }
    if (!selectedDoctorId || !selectedDate || !selectedSlot) {
      toast({
        title: "Missing details",
        description: "Select doctor, date, and time to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      await axios.post(`${API_URL}/patient/appointments/book`, {
        patientId,
        doctorId: selectedDoctorId,
        appointmentDate: selectedDate,
        appointmentTime: selectedSlot,
      });
      toast({
        title: "Appointment booked",
        description: "Your appointment has been scheduled.",
      });
      setShowBookingModal(false);
      fetchAppointments();
    } catch (error: any) {
      console.error("Failed to book appointment:", error);
      toast({
        title: "Booking failed",
        description:
          error.response?.data?.error ||
          error.message ||
          "We could not confirm this slot. Please try another time.",
        variant: "destructive",
      });
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage and review all your hospital visits in one place.</p>
        </div>
        <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
          <DialogTrigger asChild>
            <Button className="healthcare-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Book a new appointment</DialogTitle>
              <DialogDescription>Select your consultant and choose an available time slot.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookAppointment} className="space-y-6 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doctor">Doctor</Label>
                  <Select
                    value={selectedDoctorId}
                    onValueChange={(value) => {
                      setSelectedDoctorId(value);
                      setAvailableSlots([]);
                      setSelectedSlot("");
                    }}
                    disabled={doctorLoading || doctorOptions.length === 0}
                  >
                    <SelectTrigger id="doctor">
                      <SelectValue
                        placeholder={
                          doctorLoading
                            ? "Loading doctors..."
                            : doctorOptions.length
                            ? "Select doctor"
                            : "No doctors available"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {doctorOptions.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name}
                          {doctor.specialty ? ` · ${doctor.specialty}` : ""}
                          {doctor.hospitalName ? ` (${doctor.hospitalName})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-date">Date</Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={selectedDate}
                    min={todayKey}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-time">Time</Label>
                <Select
                  value={selectedSlot}
                  onValueChange={setSelectedSlot}
                  disabled={fetchingSlots || availableSlots.length === 0}
                >
                  <SelectTrigger id="appointment-time">
                    <SelectValue
                      placeholder={
                        fetchingSlots
                          ? "Checking slots..."
                          : availableSlots.length
                          ? "Select time"
                          : selectedDoctorId && selectedDate
                          ? "No slots available"
                          : "Select doctor and date first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {toDisplayTime(slot)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fetchingSlots && (
                  <p className="text-xs text-gray-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Fetching availability
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="healthcare-gradient" disabled={fetchingSlots || !selectedSlot}>
                  Confirm Booking
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by doctor, hospital, or status"
              className="pl-10 w-72"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <Button variant="outline" size="sm" onClick={fetchAppointments} disabled={appointmentsLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${appointmentsLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        {viewMode === "list" ? (
          <div className="space-y-4">
            {appointmentsLoading && <p className="text-center text-gray-500 py-8">Loading appointments...</p>}
            {!appointmentsLoading && filteredAppointments.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                {searchTerm ? "No appointments match your search." : "No appointments booked yet."}
              </p>
            )}
            {!appointmentsLoading &&
              filteredAppointments.map((appointment) => {
                const initials = appointment.doctorName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                const startDisplay = appointment.startAt
                  ? formatTimeFromIso(appointment.startAt)
                  : toDisplayTime(appointment.appointmentTime);
                return (
                  <motion.div key={appointment.id} variants={itemVariants}>
                    <Card className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                              {initials || "DR"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{appointment.doctorName}</h3>
                            <p className="text-sm text-gray-500">
                              {appointment.doctorSpecialty || "General consultation"}
                            </p>
                            {appointment.hospitalName && (
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <MapPin className="w-4 h-4 text-blue-500" />
                                {appointment.hospitalName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-left md:text-right space-y-1">
                          <p className="font-semibold text-gray-900">{formatDateReadable(appointment.appointmentDate)}</p>
                          <p className="text-sm text-gray-600">{startDisplay}</p>
                          <Badge className={`${getStatusColor(appointment.status)} capitalize`}>
                            {appointment.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Calendar View
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={handlePrevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium">
                    {currentMonth.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
                  </span>
                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center font-medium text-gray-600 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarCells.map((cell) => {
                  if (!cell.inMonth) {
                    return (
                      <div key={cell.key} className="h-24 p-2 border rounded-lg bg-gray-50 text-gray-300 text-sm" />
                    );
                  }

                  const hasAppointments = cell.appointments.length > 0;
                  return (
                    <div
                      key={cell.key}
                      className={`h-28 p-2 text-left border rounded-lg transition-colors ${
                        hasAppointments ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      } ${cell.isToday ? "ring-2 ring-blue-500 border-blue-500" : ""}`}
                    >
                      <div className="flex items-center justify-between text-sm font-medium text-gray-700">
                        <span>{cell.label}</span>
                        {cell.isToday && <span className="text-xs text-blue-600">Today</span>}
                      </div>
                      <div className="mt-2 space-y-1">
                        {cell.appointments.slice(0, 2).map((appointment) => (
                          <p key={appointment.id} className="text-xs text-gray-600 truncate">
                            {formatTimeFromIso(appointment.startAt) || toDisplayTime(appointment.appointmentTime)} ·{" "}
                            {appointment.doctorName}
                          </p>
                        ))}
                        {cell.appointments.length > 2 && (
                          <p className="text-xs text-blue-600">
                            +{cell.appointments.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
