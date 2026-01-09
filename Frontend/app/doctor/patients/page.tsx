"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Search, FileText, Loader, Pill, Clock, Calendar, NotebookPen, AlertTriangle, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { apiRoute } from "@/config/env";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useDoctorProfile } from "@/app/context/DoctorProfileContext";
import { Skeleton } from "@/components/ui/skeleton";

interface DoctorPatient {
  id: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
  age: number | null;
  gender: string | null;
  email: string;
  phone: string;
  lastVisit: string | null;
  status: string;
}

type TriageColor = "green" | "yellow" | "red";

const TRIAGE_COLORS: Record<TriageColor, string> = {
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700",
};

const resolveTriageColor = (value: unknown): TriageColor =>
  value === "red" || value === "yellow" || value === "green" ? value : "green";

const getStatusColor = (status: string) => {
  switch (status) {
    case "stable":
      return "bg-green-100 text-green-800";
    case "monitoring":
      return "bg-blue-100 text-blue-800";
    case "critical":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const renderMedications = (medications: any[]) => (
  <div className="space-y-3">
    {medications.map((med, index) => {
      const medicationNotes = med.notes || med.instructions;
      return (
        <div key={`${med.name}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Pill className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{med.name || "Medication"}</p>
              <p className="text-xs text-slate-500">{med.dosage || "Dosage not specified"}</p>
            </div>
          </div>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              Frequency: <span className="font-medium text-slate-800">{med.frequency || "—"}</span>
            </div>
            {med.duration ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Duration: <span className="font-medium text-slate-800">{med.duration}</span>
              </div>
            ) : null}
          </div>
          {medicationNotes ? (
            <p className="mt-3 rounded-md border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
              {medicationNotes}
            </p>
          ) : null}
        </div>
      );
    })}
  </div>
);

const renderAnalysis = (analysis?: any | null) => {
  if (!analysis) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        AI analysis has not been generated for this prescription yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analysis.summary_header ? (
        <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-3 text-sm font-semibold text-indigo-800">
          {analysis.summary_header}
        </div>
      ) : null}
      {analysis.report_sections?.map((section:any) => {
        const color = resolveTriageColor(section?.color);
        return (
        <div key={section.title} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{section.title}</p>
            <Badge className={TRIAGE_COLORS[color]}>
              {color === "red" ? "Critical" : color === "yellow" ? "Attention" : "Info"}
            </Badge>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {section.items?.map((item:any, idx:number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        );
      })}
      {analysis.disclaimers?.length ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground">
          {analysis.disclaimers.join(" ")}
        </div>
      ) : null}
    </div>
  );
};

export default function DoctorPatientsPage() {
  const { profileData } = useDoctorProfile();
  const { toast } = useToast();

  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientPrescriptions, setSelectedPatientPrescriptions] = useState<any[]>([]);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);

  const handleViewRecord = async (patientId: string) => {
    if (!patientId) return;
    setLoadingPrescriptions(true);
    setShowPrescriptionModal(true);
    try {
      const response = await axios.get(apiRoute(`/api/doctor/prescriptions/${patientId}`));
      setSelectedPatientPrescriptions(response.data || []);
    } catch (error: any) {
      console.error("Failed to fetch prescriptions", error);
      toast({
        title: "Unable to load prescriptions",
        description: error.response?.data?.error || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const fetchPatients = useCallback(async () => {
    if (!profileData.id) return;
    try {
      setLoading(true);
      const response = await axios.get(apiRoute(`/api/doctor/${profileData.id}/patients`));
      const mapped: DoctorPatient[] = (response.data || []).map((patient: any) => ({
        id: patient.id,
        firstName: patient.firstName ?? "",
        lastName: patient.lastName ?? "",
        fullName: patient.fullName || `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim(),
        age: patient.age ?? null,
        gender: patient.gender ?? null,
        email: patient.email ?? "",
        phone: patient.phone ?? "",
        lastVisit: patient.lastVisit ?? null,
        status: patient.status ?? "monitoring",
      }));
      setPatients(mapped);
    } catch (error: any) {
      console.error("Failed to fetch patients", error);
      toast({
        title: "Unable to load patients",
        description: error.response?.data?.error || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profileData.id, toast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const filteredPatients = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter((patient) =>
      patient.fullName.toLowerCase().includes(term) ||
      patient.phone.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  const handleAddPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!profileData.id) return;
    setFormLoading(true);

    const formData = new FormData(e.currentTarget);
    const firstName = (formData.get("firstName") as string)?.trim();
    const lastName = (formData.get("lastName") as string)?.trim();
    const genderRaw = (formData.get("gender") as string) || "unspecified";
    const gender = genderRaw === "unspecified" ? null : genderRaw;
    const ageValue = formData.get("age") as string;
    const phone = (formData.get("phone") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();

    if (!firstName || !lastName) {
      toast({
        title: "Name required",
        description: "Please provide both first and last name.",
        variant: "destructive",
      });
      setFormLoading(false);
      return;
    }

    try {
      const response = await axios.post(apiRoute(`/api/doctor/${profileData.id}/patients`), {
        firstName,
        lastName,
        gender,
        age: ageValue ? Number(ageValue) : null,
        phone,
        email,
      });

      const patient = response.data;
      const newPatient: DoctorPatient = {
        id: patient.id ?? null,
        firstName: patient.firstName ?? firstName,
        lastName: patient.lastName ?? lastName,
        fullName: `${patient.firstName ?? firstName} ${patient.lastName ?? lastName}`.trim(),
        age: patient.age ?? (ageValue ? Number(ageValue) : null),
        gender: patient.gender ?? gender,
        email: patient.email ?? email ?? "",
        phone: patient.phone ?? phone ?? "",
        lastVisit: null,
        status: "monitoring",
      };

      setPatients((prev) => [newPatient, ...prev]);
      setShowModal(false);
      toast({ title: "Patient added", description: `${newPatient.fullName} is now in your list.` });
      e.currentTarget.reset();
    } catch (error: any) {
      console.error("Failed to add patient", error);
      toast({
        title: "Unable to add patient",
        description: error.response?.data?.error || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Patient</DialogTitle>
              <DialogDescription>Capture essential details to personalize care.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input name="firstName" id="firstName" required />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input name="lastName" id="lastName" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input name="age" id="age" type="number" min={0} max={120} />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select name="gender" defaultValue="unspecified">
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unspecified">Prefer not to say</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input name="phone" id="phone" type="tel" placeholder="Optional" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input name="email" id="email" type="email" placeholder="Optional" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading && <Loader className="w-4 h-4 mr-2 animate-spin" />}Save Patient
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-grow max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by patient name or phone..."
              className="pl-10"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredPatients.length ? (
            <div className="space-y-4">
              {filteredPatients.map((patient, index) => (
                <Card key={`${patient.id ?? patient.fullName}-${index}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-green-100 text-green-600">
                          {patient.fullName
                            .split(" ")
                            .map((part) => part[0])
                            .join("")
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{patient.fullName}</h3>
                        <p className="text-sm text-gray-600">
                          {patient.age ? `${patient.age} yrs` : "Age N/A"}
                          {patient.gender ? ` · ${patient.gender}` : ""}
                        </p>
                        {patient.phone && <p className="text-sm text-gray-500">{patient.phone}</p>}
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Visit</p>
                        <p className="font-semibold">{patient.lastVisit ?? "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Status</p>
                        <Badge className={getStatusColor(patient.status)}>{patient.status}</Badge>
                      </div>
                      <Button variant="outline" onClick={() => handleViewRecord(patient.id!)}>
                        <FileText className="w-4 h-4 mr-2" />
                        View Record
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">No patients found. Add one to get started.</p>
          )}
        </CardContent>
      </Card>
      <Dialog open={showPrescriptionModal} onOpenChange={setShowPrescriptionModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Patient Prescriptions</DialogTitle>
            <DialogDescription>
              Showing all prescriptions for the selected patient.
            </DialogDescription>
          </DialogHeader>
          {loadingPrescriptions ? (
            <div className="flex items-center justify-center h-40">
              <Loader className="w-8 h-8 animate-spin" />
            </div>
          ) : selectedPatientPrescriptions.length > 0 ? (
            <div className="space-y-5 max-h-[70vh] overflow-y-auto p-4">
              {selectedPatientPrescriptions.map((record) => {
                const hasAnalysis = !!record.aiAnalysis;
                return (
                  <Card key={record.id} className="shadow-sm">
                    <CardHeader>
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <CardTitle className="text-xl text-slate-900">{record.patientName}</CardTitle>
                          <p className="text-sm text-slate-500">Updated {new Date(record.created_at).toLocaleString()}</p>
                        </div>
                        <Badge
                          className={
                            hasAnalysis
                              ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }
                        >
                          {hasAnalysis ? (
                            <>
                              <CheckCircle2 className="mr-1 h-3 w-3" /> Analyzed
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="mr-1 h-3 w-3" /> Analysis pending
                            </>
                          )}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {record.medications.length ? (
                        renderMedications(record.medications)
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                          No medications were captured for this prescription.
                        </div>
                      )}

                      {record.notes ? (
                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-900">
                          <div className="flex items-center gap-2 font-semibold">
                            <NotebookPen className="h-4 w-4 text-indigo-600" />
                            Doctor notes
                          </div>
                          <p className="mt-2 text-slate-700">{record.notes}</p>
                        </div>
                      ) : null}

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-900">AI insights</h3>
                        {renderAnalysis(record.aiAnalysis)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">No prescriptions found for this patient.</p>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={() => setShowPrescriptionModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Toaster />
    </motion.div>
  );
}
