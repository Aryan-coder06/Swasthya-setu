"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Video, Plus, Search, Loader } from "lucide-react";
import axios from "axios";
import { apiRoute } from "@/config/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Skeleton } from "@/components/ui/skeleton";
import { useDoctorProfile } from "@/app/context/DoctorProfileContext";

interface Consultation {
  id: number;
  patientId: string | null;
  patientName: string;
  appointmentDate: string | null;
  appointmentTime: string | null;
  status: string;
  meetingLink: string | null;
}

interface PatientOption {
  id: string | null;
  fullName: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "scheduled":
    case "confirmed":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const NEW_PATIENT_VALUE = "__new_patient__";

export default function DoctorConsultationsPage() {
  const { profileData } = useDoctorProfile();
  const { toast } = useToast();

  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [loadingMeetingId, setLoadingMeetingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientNameInput, setPatientNameInput] = useState("");

  const fetchConsultations = useCallback(async () => {
    if (!profileData.id) return;
    try {
      setLoading(true);
      const response = await axios.get<Consultation[]>(apiRoute(`/api/doctor/${profileData.id}/consultations`), {
        params: { t: Date.now() },
      });
      setConsultations(response.data ?? []);
    } catch (error: any) {
      console.error("Failed to fetch consultations", error);
      toast({
        title: "Unable to load consultations",
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
      const raw = Array.isArray(response.data) ? response.data : [];
      const options: PatientOption[] = raw
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
    fetchConsultations();
    fetchPatients();
  }, [fetchConsultations, fetchPatients]);

  const filteredConsultations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return consultations;
    return consultations.filter((consult) =>
      consult.patientName.toLowerCase().includes(term) ||
      (consult.appointmentDate ?? "").toLowerCase().includes(term)
    );
  }, [consultations, searchTerm]);

  const handleNewConsultation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileData.id) return;
    setFormLoading(true);

    const formData = new FormData(e.currentTarget);
    const patientName = (formData.get("patientName") as string)?.trim();
    const time = formData.get("time") as string;
    const date = formData.get("date") as string;

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
      toast({ title: "Incomplete", description: "Provide both date and time.", variant: "destructive" });
      setFormLoading(false);
      return;
    }

    try {
      await axios.post(apiRoute(`/api/doctor/${profileData.id}/appointments`), {
        patientId: selectedPatientId,
        patientName: selectedPatientId ? undefined : patientName,
        appointmentDate: date,
        appointmentTime: time,
        mode: "video",
      });

      toast({ title: "Consultation scheduled" });
      setShowModal(false);
      setSelectedPatientId(null);
      setPatientNameInput("");
      e.currentTarget.reset();
      fetchConsultations();
    } catch (error: any) {
      console.error("Failed to schedule consultation", error);
      toast({
        title: "Unable to schedule",
        description: error.response?.data?.error || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleStartCall = async (appointmentId: number, existingLink: string | null) => {
    try {
      setLoadingMeetingId(appointmentId);
      if (existingLink) {
        window.open(existingLink, "_blank");
        toast({ title: "Joining consultation" });
        return;
      }

      toast({ title: "Generating meeting", description: "Creating a secure session..." });
      const response = await axios.post(apiRoute(`/api/doctor/appointments/${appointmentId}/create-meeting`));
      const { meetingLink } = response.data;

      if (meetingLink) {
        fetchConsultations();
        window.open(meetingLink, "_blank");
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
        <h1 className="text-3xl font-bold text-gray-900">Consultations</h1>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              New Consultation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule a New Consultation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleNewConsultation} className="space-y-4">
              <div>
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
                    {patients.map((patient, index) => (
                      <SelectItem
                        key={patient.id ?? `patient-${index}`}
                        value={patient.id ?? `manual-${index}`}
                      >
                        {patient.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="patientName">Patient Name</Label>
                <Input
                  name="patientName"
                  id="patientName"
                  value={patientNameInput}
                  placeholder="e.g., John Doe"
                  onChange={(event) => {
                    setSelectedPatientId(null);
                    setPatientNameInput(event.target.value);
                  }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input name="date" id="date" type="date" required />
                </div>
                <div>
                  <Label htmlFor="time">Time</Label>
                  <Input name="time" id="time" type="time" required />
                </div>
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
          <div className="relative max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by patient name..."
              className="pl-10 w-full"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredConsultations.length ? (
            filteredConsultations.map((consult) => (
              <Card key={consult.id} className="mb-4 hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {consult.patientName
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{consult.patientName}</h3>
                      <p className="text-sm text-gray-600">
                        {consult.appointmentDate ?? "Date TBD"}, {consult.appointmentTime ?? "Time TBD"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge className={getStatusBadge(consult.status)}>
                      {consult.status}
                    </Badge>
                    <Button
                      onClick={() => handleStartCall(consult.id, consult.meetingLink)}
                      disabled={loadingMeetingId === consult.id}
                    >
                      {loadingMeetingId === consult.id ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Connecting
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4 mr-2" />
                          Start Call
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-gray-500 py-10">No consultations scheduled yet.</p>
          )}
        </CardContent>
      </Card>
      <Toaster />
    </motion.div>
  );
}
