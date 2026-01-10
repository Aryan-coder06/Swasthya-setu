"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Bed, Plus, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/config/env";
import { Toaster } from "@/components/ui/toaster";

interface RawWard {
  id: number;
  ward_name?: string;
  name?: string;
  ward?: string;
  type?: string;
  total: number;
  occupied: number;
}

interface Ward {
  id: number;
  name: string;
  total: number;
  occupied: number;
}

export default function ReceptionistBedPage() {
  const API_BASE = API_BASE_URL;

  const { toast } = useToast();
  const [bedStatus, setBedStatus] = useState<Ward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [receptionistId, setReceptionistId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!storedUser) return;
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.id) setReceptionistId(parsed.id);
      const hospital = parsed?.hospitalId ?? parsed?.hospital_id ?? null;
      if (hospital) setHospitalId(hospital);
    } catch (err) {
      console.error("Failed to parse receptionist user", err);
    }
  }, []);

  /* ------------------- NORMALIZE WARD DATA ------------------- */
  const normalizeWard = (raw: RawWard): Ward => {
    const name =
      raw.ward_name || raw.name || raw.ward || raw.type || `Ward ${raw.id}`;
    return {
      id: raw.id,
      name,
      total: raw.total,
      occupied: raw.occupied,
    };
  };

  /* ------------------- FETCH BED STATUS ------------------- */
  const fetchBedStatus = useCallback(async () => {
    if (!receptionistId && !hospitalId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (hospitalId) {
        params.set("hospitalId", hospitalId);
      } else if (receptionistId) {
        params.set("receptionistId", receptionistId);
      }
      const query = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API_BASE}/receptionist/beds/status${query}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const rawData: RawWard[] = await res.json();
      console.log("Raw beds from API:", rawData); 

      const normalized = rawData.map(normalizeWard);
      setBedStatus(normalized);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Unknown error");
      toast({
        title: "Failed to Load Beds",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [API_BASE, hospitalId, receptionistId, toast]);

  useEffect(() => {
    fetchBedStatus();
  }, [fetchBedStatus]);

/* ------------------- ADMIT PATIENT ---------------------- */
const handleNewAdmission = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setFormLoading(true);

  const form = new FormData(e.currentTarget);
  const patientName = (form.get("patientName") as string)?.trim();
  const wardName = form.get("ward") as string;

  console.log("Form Data:", { patientName, wardName });

  if (!patientName) {
    toast({ title: "Error", description: "Patient name is required", variant: "destructive" });
    setFormLoading(false);
    return;
  }

  if (!wardName) {
    toast({ title: "Error", description: "Please select a ward", variant: "destructive" });
    setFormLoading(false);
    return;
  }

  const payload = { patientName, ward: wardName }; 
  console.log("Sending payload:", payload);

  if (!receptionistId) {
    toast({ title: "Missing receptionist session", description: "Sign in again to admit patients.", variant: "destructive" });
    setFormLoading(false);
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/receptionist/beds/admit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, receptionistId }),
    });

    const result = await res.json();
    console.log("API Response:", result);

    if (!res.ok) throw new Error(result.error || "Admission failed");

    await fetchBedStatus(); 
    toast({ title: "Success", description: `${patientName} admitted to ${wardName}!` });
    setShowModal(false);
  } catch (err: any) {
    console.error("Admission error:", err);
    toast({ title: "Admission Failed", description: err.message, variant: "destructive" });
  } finally {
    setFormLoading(false);
  }
};

  const getOccupancyPercent = (ward: Ward) =>
    ward.total > 0 ? (ward.occupied / ward.total) * 100 : 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Bed Management</h1>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchBedStatus} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                New Admission
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Process New Admission</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleNewAdmission} className="space-y-4">
                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    name="patientName"
                    placeholder="Full name"
                    required
                  />
                </div>

                <div>
                <Label htmlFor="ward">Assign Ward</Label>
                <Select name="ward" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a ward..." />
                  </SelectTrigger>
                  <SelectContent>
                    {bedStatus
                      .filter((w) => w.occupied < w.total)
                      .map((ward) => (
                        <SelectItem 
                          key={ward.id} 
                          value={ward.id.toString()} 
                        >
                          {ward.name} ({ward.occupied}/{ward.total} occupied)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowModal(false)}
                    disabled={formLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Admitting...
                      </>
                    ) : (
                      "Admit Patient"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-2">Loading beds...</span>
        </div>
      ) : error ? (
        <Card className="border-red-200">
          <CardContent className="py-8 text-center">
            <p className="text-red-600 font-medium mb-2">Error: {error}</p>
            <Button onClick={fetchBedStatus} size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : bedStatus.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-gray-500">
            <p>No wards found in database.</p>
            <p className="text-sm mt-2">
              Add rows to <code className="supabase">bed_management</code> table.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bedStatus.map((ward) => {
            const percent = getOccupancyPercent(ward);
            const isFull = ward.occupied >= ward.total;

            return (
              <Card key={ward.id} className={isFull ? "border-red-300" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {ward.name}
                    {isFull && <Badge variant="destructive">Full</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-gray-600">Occupancy</p>
                    <p className="font-bold">
                      {ward.occupied} / {ward.total}
                    </p>
                  </div>
                  <Progress value={percent} className={isFull ? "bg-red-100" : ""} />
                  <Button variant="outline" className="w-full mt-4" disabled>
                    View Details
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Toaster />
    </motion.div>
  );
}
