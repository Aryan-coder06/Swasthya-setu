"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Search, FileText, Loader } from "lucide-react";
import axios from "axios";
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

export default function DoctorPatientsPage() {
  const { profileData } = useDoctorProfile();
  const { toast } = useToast();

  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPatients = useCallback(async () => {
    if (!profileData.id) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/doctor/${profileData.id}/patients`);
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
    const gender = (formData.get("gender") as string) || null;
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
      const response = await axios.post(`${API_URL}/api/doctor/${profileData.id}/patients`, {
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
                  <Select name="gender" defaultValue="">
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Prefer not to say</SelectItem>
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
                      <Button variant="outline">
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
      <Toaster />
    </motion.div>
  );
}
