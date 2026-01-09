"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Printer, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { API_BASE_URL } from "@/config/env";

interface WalkinTicket {
  id: number;
  ticket_number: string;
  patient_name: string;
  status: "waiting" | "serving" | "completed";
  created_at: string;
}

export default function ReceptionistWalkinPage() {
  const API_BASE = API_BASE_URL;

  const { toast } = useToast();
  const [tickets, setTickets] = useState<WalkinTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
const [patientName, setPatientName] = useState("");
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
    } catch (error) {
      console.error("Failed to parse receptionist info", error);
    }
  }, []);

  /* ------------------- FETCH TODAY'S TICKETS ------------------- */
  const fetchTickets = useCallback(async () => {
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
      const res = await fetch(`${API_BASE}/receptionist/walkin/today${query}`, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      const data: WalkinTicket[] = await res.json();
      setTickets(data);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Failed to Load Tickets", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [API_BASE, hospitalId, receptionistId, toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  /* ------------------- CREATE TICKET ------------------- */
  const handleGenerateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const name = patientName.trim() || "Anonymous Patient";
    if (!receptionistId) {
      toast({ title: "Missing receptionist session", description: "Sign in again to generate tickets.", variant: "destructive" });
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/receptionist/walkin/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientName: name, receptionistId }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to generate ticket");

      await fetchTickets();
      toast({ title: "Ticket Generated", description: `Ticket ${result.data.ticket_number} for ${name}` });
      setShowModal(false);
      setPatientName("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  /* ------------------- UPDATE STATUS ------------------- */
const updateStatus = async (ticketId: number, status: "serving" | "completed") => {
  if (!receptionistId) {
    toast({ title: "Missing receptionist session", description: "Sign in again to update tickets.", variant: "destructive" });
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/receptionist/walkin/update-status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ticketId,  
        status,
        receptionistId,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update status");
    }

    await fetchTickets();
    toast({ 
      title: "Success", 
      description: status === "serving" ? "Patient called" : "Visit completed" 
    });
  } catch (err: any) {
    toast({ title: "Error", description: err.message, variant: "destructive" });
  }
};

  /* ------------------- FILTER TICKETS ------------------- */
  const waiting = tickets.filter(t => t.status === "waiting");
  const serving = tickets.find(t => t.status === "serving");
  const completed = tickets.filter(t => t.status === "completed");

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Walk-in Tickets</h1>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Generate New Ticket
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Generate Walk-in Ticket</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleGenerateTicket} className="space-y-4">
                <div>
                  <Label htmlFor="patientName">Patient Name (Optional)</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Leave blank for Anonymous"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={formLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Queue & Now Serving */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Queue */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Current Queue ({waiting.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : waiting.length === 0 ? (
              <p className="text-center text-gray-500 py-8">The queue is empty.</p>
            ) : (
              <div className="space-y-2">
                {waiting.map((t) => (
                  <div key={t.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <span className="font-bold text-lg text-purple-600">{t.ticket_number}</span>
                      <span className="ml-3 font-medium">{t.patient_name}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => updateStatus(t.id, "serving")}
                      disabled={!!serving}
                    >
                      Call Next
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Now Serving */}
        <Card>
          <CardHeader>
            <CardTitle>Now Serving</CardTitle>
            <CardDescription>Currently with the doctor</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {serving ? (
              <>
                <p className="text-8xl font-bold text-purple-600">{serving.ticket_number}</p>
                <p className="text-lg text-gray-700 mt-2">{serving.patient_name}</p>
                <Button
                  className="mt-4 w-full"
                  variant="outline"
                  onClick={() => updateStatus(serving.id, "completed")}
                >
                  Complete Visit
                </Button>
              </>
            ) : (
              <>
                <p className="text-8xl font-bold text-gray-300">---</p>
                <p className="text-lg text-gray-500 mt-2">Nobody</p>
              </>
            )}
            <Button className="mt-4 w-full" variant="outline">
              <Printer className="w-4 h-4 mr-2" />
              Print Ticket
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Completed Today */}
      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Today ({completed.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {completed.map((t) => (
                <Badge key={t.id} variant="secondary" className="justify-center py-2">
                  {t.ticket_number}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Toaster />
    </motion.div>
  );
}
