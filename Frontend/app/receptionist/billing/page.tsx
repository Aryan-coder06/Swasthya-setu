"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Plus,
  Search,
  Printer,
  Loader2,
  RefreshCw,
  Trash2,
  IndianRupee,
  Wallet,
  PiggyBank,
} from "lucide-react";
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
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid">("all");

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
  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesTerm =
        inv.invoice_number.toLowerCase().includes(term) ||
        inv.patient_name.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" ? true : inv.status === statusFilter;
      return matchesTerm && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const pending = invoices.filter((inv) => inv.status === "pending");
    const paid = invoices.filter((inv) => inv.status === "paid");
    const pendingAmount = pending.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidAmount = paid.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    return {
      totalInvoices: invoices.length,
      pendingInvoices: pending.length,
      paidInvoices: paid.length,
      totalAmount,
      pendingAmount,
      paidAmount,
    };
  }, [invoices]);

  const formatCurrency = (value: number | undefined) =>
    `₹${(value ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  const statusBadge = (status: Invoice["status"]) => {
    const classes =
      status === "paid"
        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
        : "bg-amber-100 text-amber-800 border border-amber-200";
    return (
      <Badge className={classes} variant="outline">
        {status}
      </Badge>
    );
  };

  const displayedServices = (lineItems: Invoice["services"]) => {
    if (!lineItems || !lineItems.length) {
      return <span className="text-slate-400 text-sm">No services listed</span>;
    }
    if (typeof lineItems[0] === "string") {
      return <span className="text-sm text-slate-600 line-clamp-2">{lineItems.join(", ")}</span>;
    }
    const typed = lineItems as Service[];
    if (typed.length === 1) {
      return (
        <span className="text-sm text-slate-600">
          {typed[0].name} · {formatCurrency(typed[0].amount)}
        </span>
      );
    }
    return (
      <span className="text-sm text-slate-600">
        {typed[0].name} · {formatCurrency(typed[0].amount)}{" "}
        <span className="text-xs text-slate-400">(+{typed.length - 1} more)</span>
      </span>
    );
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    const printWindow = window.open("", "_blank", "width=640,height=840");
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Allow popups to print the receipt.",
        variant: "destructive",
      });
      return;
    }

    const servicesMarkup = Array.isArray(invoice.services)
      ? invoice.services
          .map((service) =>
            typeof service === "string"
              ? `<li>${service}</li>`
              : `<li>${service.name} — ${formatCurrency(service.amount)}</li>`
          )
          .join("")
      : "";

    printWindow.document.write(`
      <html>
        <head>
          <title>${invoice.invoice_number}</title>
          <style>
            body { font-family: "Inter", sans-serif; padding: 24px; color: #0f172a; }
            h1 { font-size: 20px; margin-bottom: 8px; }
            .meta { margin-bottom: 12px; font-size: 14px; }
            .meta span { display: block; margin-bottom: 4px; }
            ul { padding-left: 20px; line-height: 1.4; }
            .amount { font-size: 18px; font-weight: 600; margin-top: 16px; }
          </style>
        </head>
        <body>
          <h1>SwasthyaSetu Invoice</h1>
          <div class="meta">
            <span><strong>Invoice #:</strong> ${invoice.invoice_number}</span>
            <span><strong>Patient:</strong> ${invoice.patient_name}</span>
            <span><strong>Status:</strong> ${invoice.status.toUpperCase()}</span>
            <span><strong>Issued on:</strong> ${new Date(invoice.created_at).toLocaleString()}</span>
            ${
              invoice.paid_at
                ? `<span><strong>Paid on:</strong> ${new Date(invoice.paid_at).toLocaleString()}</span>`
                : ""
            }
          </div>
          ${
            servicesMarkup
              ? `<strong>Services</strong><ul>${servicesMarkup}</ul>`
              : "<em>No itemised services captured</em>"
          }
          <div class="amount">Amount Due: ${formatCurrency(invoice.amount)}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track open dues, raise receipts, and settle payments for your hospital.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
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

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total invoices",
            primary: summary.totalInvoices,
            secondary: formatCurrency(summary.totalAmount),
            icon: CreditCard,
            accent: "bg-slate-100 text-slate-800",
          },
          {
            title: "Pending payments",
            primary: summary.pendingInvoices,
            secondary: formatCurrency(summary.pendingAmount),
            icon: Wallet,
            accent: "bg-amber-100 text-amber-900",
          },
          {
            title: "Collected",
            primary: summary.paidInvoices,
            secondary: formatCurrency(summary.paidAmount),
            icon: IndianRupee,
            accent: "bg-emerald-100 text-emerald-900",
          },
          {
            title: "Avg. ticket size",
            primary: invoices.length
              ? `₹${Math.round(summary.totalAmount / Math.max(invoices.length, 1)).toLocaleString()}`
              : "₹0",
            secondary: "Across all invoices",
            icon: PiggyBank,
            accent: "bg-indigo-100 text-indigo-900",
          },
        ].map((card) => (
          <motion.div
            key={card.title}
            whileHover={{ scale: 1.01 }}
            className="rounded-xl border bg-white p-4 flex items-center justify-between shadow-sm"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">{card.title}</p>
              <p className="text-2xl font-semibold text-slate-900 mt-1">{card.primary}</p>
              <p className="text-sm text-slate-500">{card.secondary}</p>
            </div>
            <div className={`p-3 rounded-full ${card.accent}`}>
              <card.icon className="h-5 w-5" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative w-full lg:w-1/2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by invoice ID or patient name..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["all", "pending", "paid"] as Array<"all" | "pending" | "paid">).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== "all" && (
                    <Badge className="ml-2" variant="secondary">
                      {status === "pending" ? summary.pendingInvoices : summary.paidInvoices}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              <span className="ml-2 text-slate-500">Loading invoices…</span>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">
              <p className="font-medium">Error: {error}</p>
              <Button onClick={fetchInvoices} size="sm" className="mt-3">
                Retry
              </Button>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-10 text-center text-slate-500">
              {invoices.length === 0
                ? "No invoices recorded yet. Create your first invoice to populate this view."
                : "No invoices match the selected filters."}
            </div>
          ) : (
            <div className="overflow-x-auto">
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
                      <TableCell>
                        <p className="font-semibold text-slate-900">{inv.patient_name}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </p>
                      </TableCell>
                      <TableCell>{displayedServices(inv.services)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(inv.amount)}</TableCell>
                      <TableCell>{statusBadge(inv.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {inv.status === "pending" ? (
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => handleStatusUpdate(inv.id, "paid")}
                            >
                              Mark Paid
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(inv.id, "pending")}
                            >
                              Unmark
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handlePrintInvoice(inv)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Toaster />
    </motion.div>
  );
}
