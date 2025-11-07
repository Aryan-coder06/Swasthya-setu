"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, RefreshCw, Search, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { API_BASE_URL } from "@/config/env";
import { Textarea } from "@/components/ui/textarea";
import { getReceptionistAppointmentRequests, respondToAppointmentRequestApi } from "@/lib/api";
import type { AppointmentRequest } from "@/lib/types";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone_no: string | number | null;
  gender: string | null;
  age: number | null;
  created_at: string | null;
}

const GENDER_OPTIONS = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Non-binary", label: "Non-binary" },
  { value: "Other", label: "Other" },
];

const formatName = (patient: Patient) =>
  [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
  "Unnamed patient";

const formatDate = (dateString: string | null) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const sanitizePhone = (phone: string) => phone.replace(/\D/g, "");

export default function ReceptionistPatientPage() {
  const API_BASE = API_BASE_URL;

  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [receptionistId, setReceptionistId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [appointmentRequests, setAppointmentRequests] = useState<AppointmentRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [doctors, setDoctors] = useState<Array<{ id: string; firstName?: string; lastName?: string; specs?: string | null }>>([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState<string | undefined>();
  const [age, setAge] = useState("");

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setGender(undefined);
    setAge("");
  };

  const fetchPatients = useCallback(async () => {
    if (!hospitalId && !receptionistId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (hospitalId) params.set("hospitalId", hospitalId);
      if (!hospitalId && receptionistId) params.set("receptionistId", receptionistId);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API_BASE}/receptionist/patients/all${query}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to load patient directory");
      }
      const data: Patient[] = await res.json();
      setPatients(data);
    } catch (err: any) {
      console.error("Patient fetch error:", err);
      const message = err.message ?? "Unexpected error while loading patients.";
      setError(message);
      toast({
        title: "Failed to load patients",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [API_BASE, toast, hospitalId, receptionistId]);

  const fetchDoctors = useCallback(async () => {
    if (!hospitalId && !receptionistId) return;
    try {
      const params = new URLSearchParams();
      if (hospitalId) params.set("hospitalId", hospitalId);
      if (!hospitalId && receptionistId) params.set("receptionistId", receptionistId);
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API_BASE}/receptionist/doctors/all${query}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload.error || "Unable to load doctors");
      }
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Doctor fetch error:", err);
      setDoctors([]);
    }
  }, [API_BASE, hospitalId, receptionistId]);

  const fetchAppointmentRequests = useCallback(async () => {
    if (!receptionistId) return;
    setRequestsLoading(true);
    try {
      const response = await getReceptionistAppointmentRequests({
        receptionistId,
        status: "pending",
      });
      setAppointmentRequests(response.requests);
    } catch (err: any) {
      console.error("Failed to load appointment requests", err);
      toast({
        title: "Unable to load requests",
        description: err?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setRequestsLoading(false);
    }
  }, [receptionistId, toast]);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!storedUser) return;
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.id) {
        setReceptionistId(parsed.id);
      }
      const hosp = parsed?.hospitalId ?? parsed?.hospital_id ?? null;
      if (hosp) {
        setHospitalId(hosp);
      }
    } catch (error) {
      console.error("Failed to parse receptionist info", error);
    }
  }, []);

  useEffect(() => {
    if (!hospitalId && !receptionistId) return;
    fetchPatients();
    fetchDoctors();
  }, [fetchPatients, fetchDoctors, hospitalId, receptionistId]);

  useEffect(() => {
    fetchAppointmentRequests();
  }, [fetchAppointmentRequests]);

  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return patients;

    return patients.filter((patient) => {
      const name = formatName(patient).toLowerCase();
      const phoneNumber = (patient.phone_no ?? "")
        .toString()
        .toLowerCase();
      const emailAddress = (patient.email ?? "").toLowerCase();
      return (
        name.includes(term) ||
        phoneNumber.includes(term) ||
        emailAddress.includes(term)
      );
    });
  }, [patients, searchTerm]);

  const handleRegisterPatient = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setFormLoading(true);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const sanitizedPhone = sanitizePhone(phone);

    if (!trimmedFirst || !trimmedLast) {
      toast({
        title: "Missing name",
        description: "Please provide both first and last name.",
        variant: "destructive",
      });
      setFormLoading(false);
      return;
    }

    if (!sanitizedPhone) {
      toast({
        title: "Phone number required",
        description: "Enter a valid contact number (digits only).",
        variant: "destructive",
      });
      setFormLoading(false);
      return;
    }

    const payload = {
      firstName: trimmedFirst,
      lastName: trimmedLast,
      email: email.trim() || null,
      phone_no: sanitizedPhone ? Number(sanitizedPhone) : null,
      gender: gender ?? null,
      age: age ? Number(age) : null,
    };

    try {
      const res = await fetch(`${API_BASE}/receptionist/patients/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || "Unable to register patient");
      }

      const createdPatient: Patient = result.data;
      setPatients((prev) =>
        [createdPatient, ...prev].sort((a, b) =>
          (b.created_at ?? "").localeCompare(a.created_at ?? "")
        )
      );
      toast({
        title: "Patient registered",
        description: `${formatName(createdPatient)} has been added.`,
      });
      setShowModal(false);
      resetForm();
      fetchPatients();
    } catch (err: any) {
      toast({
        title: "Registration failed",
        description: err.message ?? "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<AppointmentRequest | null>(null);
  const [responseMode, setResponseMode] = useState<"accept" | "decline">("accept");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [declineReason, setDeclineReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [responding, setResponding] = useState(false);

  const openRespondDialog = (request: AppointmentRequest, mode: "accept" | "decline") => {
    setCurrentRequest(request);
    setResponseMode(mode);
    setSelectedDoctor("");
    setSelectedDate(request.preferred_date ?? "");
    setSelectedTime(request.preferred_time ?? "");
    setDeclineReason("");
    setNotes(request.notes ?? "");
    setRespondDialogOpen(true);
  };

  const handleRespond = async () => {
    if (!currentRequest || !receptionistId) return;
    try {
      setResponding(true);
      if (responseMode === "accept") {
        if (!selectedDoctor || !selectedDate || !selectedTime) {
          toast({
            title: "Missing details",
            description: "Select doctor, date, and time to confirm the appointment.",
            variant: "destructive",
          });
          return;
        }
      }

      await respondToAppointmentRequestApi({
        requestId: currentRequest.id,
        action: responseMode,
        receptionistId,
        doctorId: responseMode === "accept" ? selectedDoctor : undefined,
        appointmentDate: responseMode === "accept" ? selectedDate : undefined,
        appointmentTime: responseMode === "accept" ? selectedTime : undefined,
        declineReason: responseMode === "decline" ? declineReason : undefined,
        notes: notes || undefined,
      });

      toast({
        title: responseMode === "accept" ? "Appointment scheduled" : "Request declined",
        description:
          responseMode === "accept"
            ? "The patient and doctor have been notified."
            : "The patient has been informed of the decision.",
      });

      setRespondDialogOpen(false);
      fetchAppointmentRequests();
      fetchPatients();
    } catch (error: any) {
      toast({
        title: "Action failed",
        description: error?.message || "Unable to process the request right now.",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  };

  useEffect(() => {
    if (doctors.length && !selectedDoctor) {
      setSelectedDoctor(doctors[0].id);
    }
  }, [doctors, selectedDoctor]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Register new patients, keep records updated, and sync across the care teams.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPatients} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog
            open={showModal}
            onOpenChange={(open) => {
              setShowModal(open);
              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Register Patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Patient Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleRegisterPatient} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="e.g. 9810012345"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email (optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@example.com"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={gender}
                      onValueChange={(value) => setGender(value)}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      min="0"
                      value={age}
                      onChange={(event) => setAge(event.target.value)}
                      placeholder="Optional"
                    />
                  </div>
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
                      <span className="inline-flex items-center">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      "Register"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-500" /> Pending Appointment Requests
              </CardTitle>
              <CardDescription>
                Review patient requests awaiting confirmation for your hospital.
              </CardDescription>
            </div>
            <Badge variant="outline">
              {appointmentRequests.length} awaiting action
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {requestsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="h-16 rounded-lg border animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : appointmentRequests.length === 0 ? (
            <p className="text-sm text-slate-500">
              No appointment requests are pending right now.
            </p>
          ) : (
            <div className="space-y-3">
              {appointmentRequests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-xl border p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {request.patient_name || "Patient"}
                    </p>
                    <p className="text-xs text-slate-500">
                      Preferred: {request.preferred_date ?? "Any day"} · {request.preferred_time ?? "Any time"}
                    </p>
                    {request.notes && (
                      <p className="text-xs text-slate-500 mt-1">
                        Notes: {request.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => openRespondDialog(request, "accept")}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openRespondDialog(request, "decline")}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by name, phone, or email..."
              className="pl-10 w-full md:w-2/3"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          {error && (
            <p className="text-sm text-red-500 mt-2">
              {error}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-purple-600 py-6">Loading patients...</p>
          ) : filteredPatients.length === 0 ? (
            <p className="text-center text-gray-500 py-6">
              No patients match the current filter.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Registered On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">
                      {formatName(patient)}
                      <div className="text-xs text-gray-400 mt-1">
                        {patient.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>{patient.phone_no ?? "—"}</span>
                        <span className="text-sm text-gray-500">
                          {patient.email ?? "No email"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {patient.gender ? (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {patient.gender}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{patient.age ?? "—"}</TableCell>
                    <TableCell>{formatDate(patient.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {responseMode === "accept" ? "Confirm appointment details" : "Decline appointment request"}
            </DialogTitle>
            <CardDescription>
              {currentRequest?.patient_name || "Patient"} · {currentRequest?.hospital_name || "Assigned hospital"}
            </CardDescription>
          </DialogHeader>
          {responseMode === "accept" ? (
            <div className="space-y-4 py-2">
              <div>
                <Label>Assign doctor</Label>
                <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctors.length === 0 && <SelectItem value="" disabled>No doctors found</SelectItem>}
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        Dr. {doctor.firstName ?? ""} {doctor.lastName ?? ""}
                        {doctor.specs ? ` · ${doctor.specs}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appointment-date">Date</Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="appointment-time">Time</Label>
                  <Input
                    id="appointment-time"
                    type="time"
                    value={selectedTime}
                    onChange={(event) => setSelectedTime(event.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-1"
                  placeholder="Add any additional information for the patient or doctor"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="decline-reason">Reason</Label>
                <Textarea
                  id="decline-reason"
                  value={declineReason}
                  onChange={(event) => setDeclineReason(event.target.value)}
                  placeholder="Share a brief reason to help the patient understand."
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRespondDialogOpen(false)} disabled={responding}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={responding}>
              {responding ? "Saving..." : responseMode === "accept" ? "Confirm" : "Submit"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster />
    </motion.div>
  );
}
