"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/receptionist/patients/all`, {
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
  }, [API_BASE, toast]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

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

      <Toaster />
    </motion.div>
  );
}
