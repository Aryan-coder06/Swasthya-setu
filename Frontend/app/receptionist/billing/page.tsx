"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Plus, Search, Printer, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { API_BASE_URL } from "@/config/env";

interface Service {
  name: string;
  amount: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  patient_name: string;
  amount: number;
  services: Service[];
  status: "pending" | "paid";
  created_at: string;
  paid_at?: string;
}

export default function ReceptionistBillingPage() {
  const API_BASE = API_BASE_URL;

  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Form state
  const [patientName, setPatientName] = useState("");
  const [services, setServices] = useState<Service[]>([{ name: "", amount: 0 }]);

  /* ------------------- FETCH INVOICES ------------------- */
  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/receptionist/billing/all`, { cache: "no-store" });
      if (!res.ok) throw new Error((await res.json()).error || `HTTP ${res.status}`);
      const data: Invoice[] = await res.json();
      setInvoices(data);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Failed to Load Invoices", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  /* ------------------- ADD/REMOVE SERVICE ------------------- */
  const addService = () => {
    setServices([...services, { name: "", amount: 0 }]);
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const updateService = (index: number, field: "name" | "amount", value: string | number) => {
    const updated = [...services];
    updated[index] = { ...updated[index], [field]: field === "amount" ? Number(value) || 0 : value };
    setServices(updated);
  };

  const totalAmount = services.reduce((sum, s) => sum + s.amount, 0);

  /* ------------------- CREATE INVOICE ------------------- */
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    if (!patientName.trim()) {
      toast({ title: "Error", description: "Patient name is required", variant: "destructive" });
      setFormLoading(false);
      return;
    }

    const validServices = services.filter(s => s.name.trim() && s.amount > 0);
    if (validServices.length === 0) {
      toast({ title: "Error", description: "Add at least one valid service", variant: "destructive" });
      setFormLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/receptionist/billing/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim(),
          amount: totalAmount,
          services: validServices,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create invoice");

      await fetchInvoices();
      toast({ title: "Invoice Created", description: `Invoice ${result.data.invoice_number} for ₹${totalAmount}` });
      setShowModal(false);
      setPatientName("");
      setServices([{ name: "", amount: 0 }]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setFormLoading(false);
    }
  };

  /* ------------------- UPDATE STATUS ------------------- */
  const handleStatusUpdate = async (invoiceId: number, newStatus: "paid" | "pending") => {
    try {
      const res = await fetch(`${API_BASE}/receptionist/billing/update-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await fetchInvoices();
      toast({ title: "Status Updated", description: `Marked as ${newStatus}` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  /* ------------------- FILTER INVOICES ------------------- */
  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchInvoices} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreateInvoice} className="space-y-5">
                {/* Patient Name */}
                <div>
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* Services */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Services</Label>
                    <Button type="button" size="sm" onClick={addService} variant="outline">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Service
                    </Button>
                  </div>

                  {services.map((service, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input
                          placeholder="Service name (e.g. Consultation)"
                          value={service.name}
                          onChange={(e) => updateService(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="w-28">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={service.amount || ""}
                          onChange={(e) => updateService(index, "amount", e.target.value)}
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => removeService(index)}
                        disabled={services.length === 1}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total Amount</span>
                    <span>₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setShowModal(false)} disabled={formLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={formLoading || totalAmount === 0}>
                    {formLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Invoice"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by invoice ID or patient name..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="ml-2">Loading invoices...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p className="font-medium">Error: {error}</p>
              <Button onClick={fetchInvoices} size="sm" className="mt-2">
                Retry
              </Button>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No invoices found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.patient_name}</TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        {inv.services.map((s, i) => (
                          <div key={i}>
                            **{s.name}: ₹{(s.amount ?? 0).toLocaleString()}** // FIX APPLIED HERE                          
                        </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">₹{inv.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          inv.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusUpdate(inv.id, inv.status === "paid" ? "pending" : "paid")}
                      >
                        {inv.status === "paid" ? "Unmark" : "Mark Paid"}
                      </Button>
                      <Button size="sm">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </TableCell>
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
