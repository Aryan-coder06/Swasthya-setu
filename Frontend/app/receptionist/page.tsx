"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  CreditCard,
  Bed,
  Plus,
  Printer,
  Clock,
  Phone,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { toast as notify } from "react-toastify";
import { API_BASE_URL } from "@/config/env";
import type { AppointmentRequest, InvoiceRecord, DoctorSummary } from "@/lib/types";
import {
  getReceptionistAppointmentRequests,
  respondToAppointmentRequestApi,
  createWalkInTicketApi,
  createReceptionistAppointmentApi,
  createInvoiceApi,
  fetchInvoicesApi,
  fetchDoctorsForHospitalApi,
} from "@/lib/api";

interface DashboardStats {
  todayAppointments: number;
  todayWalkins: number;
  todayPayments: number;
  availableBeds: number;
}

interface AppointmentRow {
  id: string;
  patient_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  doctor?: {
    firstName?: string;
    lastName?: string;
  } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function ReceptionistDashboardPage() {
  const router = useRouter();
  const { toast: pushToast } = useToast();

  const [receptionistName, setReceptionistName] = useState("Receptionist");
  const [receptionistId, setReceptionistId] = useState<string | null>(null);
  const [hospitalId, setHospitalId] = useState<string | null>(null);
  const [hospitalName, setHospitalName] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    todayWalkins: 0,
    todayPayments: 0,
    availableBeds: 0,
  });
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AppointmentRequest[]>([]);
  const [recentApprovals, setRecentApprovals] = useState<AppointmentRequest[]>([]);
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [respondDialogOpen, setRespondDialogOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<AppointmentRequest | null>(null);
  const [responseMode, setResponseMode] = useState<"accept" | "decline">("accept");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [declineReason, setDeclineReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [responding, setResponding] = useState(false);

  const [walkInDialogOpen, setWalkInDialogOpen] = useState(false);
  const [walkInPatientName, setWalkInPatientName] = useState("");
  const [creatingWalkIn, setCreatingWalkIn] = useState(false);

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [appointmentPatientName, setAppointmentPatientName] = useState("");
  const [appointmentPatientId, setAppointmentPatientId] = useState("");
  const [appointmentDoctorId, setAppointmentDoctorId] = useState("");
  const [appointmentDateInput, setAppointmentDateInput] = useState("");
  const [appointmentTimeInput, setAppointmentTimeInput] = useState("");
  const [creatingAppointment, setCreatingAppointment] = useState(false);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentPatientName, setPaymentPatientName] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentServices, setPaymentServices] = useState("");
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const pendingRequestIdsRef = useRef<Set<string>>(new Set());

  const handleOpenPrintDialog = useCallback(async () => {
    setPrintDialogOpen(true);
    setInvoicesLoading(true);
    try {
      const records = await fetchInvoicesApi();
      setInvoices(records);
      if (records.length) {
        setSelectedInvoiceId(records[0].id);
      } else {
        setSelectedInvoiceId(null);
      }
    } catch (error: any) {
      console.error("Load invoices error:", error);
      pushToast({
        title: "Unable to load receipts",
        description: error?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setInvoicesLoading(false);
    }
  }, [pushToast]);

  const loadDashboard = useCallback(async () => {
    if (!hospitalId && !receptionistId) return;
    try {
      const statsRes = await fetch(`${API_BASE_URL}/receptionist/dashboard/stats`);
      if (!statsRes.ok) throw new Error("Failed to fetch stats");
      const statsJson = await statsRes.json();
      setStats(statsJson ?? {});

      const params = new URLSearchParams();
      if (receptionistId) params.set("receptionistId", receptionistId);
      if (hospitalId) params.set("hospitalId", hospitalId);
      const query = params.toString() ? `?${params.toString()}` : "";

      const apptRes = await fetch(`${API_BASE_URL}/receptionist/appointments/all${query}`);
      if (!apptRes.ok) throw new Error("Failed to fetch appointments");
      const apptJson = await apptRes.json();
      setAppointments(Array.isArray(apptJson) ? apptJson : []);
    } catch (err) {
      console.error(err);
      setError((err as Error).message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [receptionistId, hospitalId]);

  const handleCreateWalkInTicket = useCallback(async () => {
    try {
      setCreatingWalkIn(true);
      const ticket = await createWalkInTicketApi(walkInPatientName.trim());
      pushToast({
        title: "Walk-in ticket created",
        description: `Ticket ${ticket.ticket_number} is queued.`,
      });
      setWalkInDialogOpen(false);
      setWalkInPatientName("");
      setStats((prev) => ({
        ...prev,
        todayWalkins: (prev.todayWalkins ?? 0) + 1,
      }));
    } catch (error: any) {
      console.error("Walk-in creation error:", error);
      pushToast({
        title: "Unable to create ticket",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingWalkIn(false);
    }
  }, [pushToast, walkInPatientName]);

  const handleCreateAppointment = useCallback(async () => {
    if (!appointmentDoctorId || !appointmentDateInput || !appointmentTimeInput) {
      pushToast({
        title: "Missing details",
        description: "Select doctor, date, and time to create an appointment.",
        variant: "destructive",
      });
      return;
    }
    try {
      setCreatingAppointment(true);
      await createReceptionistAppointmentApi({
        doctorId: appointmentDoctorId,
        appointmentDate: appointmentDateInput,
        appointmentTime: appointmentTimeInput,
        patientId: appointmentPatientId || undefined,
        patientName: appointmentPatientName || undefined,
      });
      pushToast({
        title: "Appointment scheduled",
        description: "Doctor and patient have been notified.",
      });
      setScheduleDialogOpen(false);
      setAppointmentPatientName("");
      setAppointmentPatientId("");
      setAppointmentDoctorId("");
      setAppointmentDateInput("");
      setAppointmentTimeInput("");
      await loadDashboard();
    } catch (error: any) {
      console.error("Create appointment error:", error);
      pushToast({
        title: "Unable to schedule appointment",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingAppointment(false);
    }
  }, [
    appointmentDateInput,
    appointmentDoctorId,
    appointmentPatientId,
    appointmentPatientName,
    appointmentTimeInput,
    loadDashboard,
    pushToast,
  ]);

  const handleCreateInvoice = useCallback(async () => {
    const amountValue = Number(paymentAmount);
    if (!paymentPatientName.trim() || Number.isNaN(amountValue) || amountValue <= 0) {
      pushToast({
        title: "Missing details",
        description: "Provide patient name and a valid amount.",
        variant: "destructive",
      });
      return;
    }
    try {
      setCreatingInvoice(true);
      const services = paymentServices
        .split(",")
        .map((service) => service.trim())
        .filter(Boolean);
      await createInvoiceApi({
        patientName: paymentPatientName.trim(),
        amount: amountValue,
        services,
      });
      pushToast({
        title: "Invoice created",
        description: "Invoice saved and ready for payment processing.",
      });
      setPaymentDialogOpen(false);
      setPaymentPatientName("");
      setPaymentAmount("");
      setPaymentServices("");
      setStats((prev) => ({
        ...prev,
        todayPayments: (prev.todayPayments ?? 0) + amountValue,
      }));
    } catch (error: any) {
      console.error("Create invoice error:", error);
      pushToast({
        title: "Unable to create invoice",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setCreatingInvoice(false);
    }
  }, [paymentAmount, paymentPatientName, paymentServices, pushToast]);

  const handlePrintInvoice = useCallback(() => {
    if (!selectedInvoiceId) {
      pushToast({
        title: "Select a receipt",
        description: "Choose an invoice before printing.",
        variant: "destructive",
      });
      return;
    }
    const invoice = invoices.find((item) => item.id === selectedInvoiceId);
    if (!invoice) {
      pushToast({
        title: "Invoice not found",
        description: "Refresh the list and try again.",
        variant: "destructive",
      });
      return;
    }
    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (!printWindow) {
      pushToast({
        title: "Popup blocked",
        description: "Allow popups to print the receipt.",
        variant: "destructive",
      });
      return;
    }
    const servicesHtml = (invoice.services || [])
      .map((service) => `<li>${service}</li>`)
      .join("");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice ${invoice.invoice_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #1f2937; }
            h1 { font-size: 20px; margin-bottom: 16px; }
            .meta { margin-bottom: 12px; }
            .meta span { display: block; margin-bottom: 4px; }
            ul { margin-top: 10px; padding-left: 18px; }
            .amount { font-weight: 600; margin-top: 12px; font-size: 18px; }
          </style>
        </head>
        <body>
          <h1>SwasthyaSetu Receipt</h1>
          <div class="meta">
            <span><strong>Invoice #:</strong> ${invoice.invoice_number}</span>
            <span><strong>Patient:</strong> ${invoice.patient_name}</span>
            <span><strong>Date:</strong> ${new Date(invoice.created_at).toLocaleString()}</span>
            <span><strong>Status:</strong> ${invoice.status}</span>
          </div>
          ${servicesHtml ? `<strong>Services</strong><ul>${servicesHtml}</ul>` : ""}
          <div class="amount">Amount: ₹${invoice.amount.toLocaleString()}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [invoices, selectedInvoiceId, pushToast]);

  const refreshRequestQueues = useCallback(async () => {
    if (!receptionistId) return;
    setRequestsLoading(true);
    try {
      const [pendingResponse, approvedResponse] = await Promise.all([
        getReceptionistAppointmentRequests({
          receptionistId,
          status: "pending",
        }),
        getReceptionistAppointmentRequests({
          receptionistId,
          status: "accepted",
        }),
      ]);

      setPendingRequests(pendingResponse.requests);
      setRecentApprovals((approvedResponse.requests ?? []).slice(0, 5));

      const hospitalSource =
        pendingResponse.hospital ??
        approvedResponse.hospital ??
        null;

      if (hospitalSource?.name) {
        setHospitalName(hospitalSource.name);
      }

      const effectiveHospitalId =
        hospitalId ??
        hospitalSource?.id ??
        (hospitalSource as any)?.hospitalId ??
        (hospitalSource as any)?.hospital_id ??
        null;

      if (!hospitalId && effectiveHospitalId) {
        setHospitalId(effectiveHospitalId);
      }

      if (effectiveHospitalId) {
        try {
          const doctorList = await fetchDoctorsForHospitalApi(effectiveHospitalId);
          setDoctors(Array.isArray(doctorList) ? doctorList : []);
        } catch (doctorError) {
          console.error("Doctor directory load failed:", doctorError);
        }
      }
    } catch (err) {
      console.error("Failed to load appointment requests", err);
      setPendingRequests([]);
      setRecentApprovals([]);
    } finally {
      setRequestsLoading(false);
    }
  }, [receptionistId, hospitalId]);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!storedUser) {
      setLoading(false);
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.firstName || parsed?.lastName) {
        setReceptionistName(
          `${parsed.firstName ?? ""} ${parsed.lastName ?? ""}`.trim() || "Receptionist"
        );
      }
      if (parsed?.id) setReceptionistId(parsed.id);
      if (parsed?.hospitalId || parsed?.hospital_id) {
        setHospitalId(parsed.hospitalId ?? parsed.hospital_id);
      }
    } catch (err) {
      console.error("Failed to parse receptionist user", err);
    }
  }, []);

  useEffect(() => {
    if (!hospitalId && !receptionistId) return;
    loadDashboard();
  }, [loadDashboard, hospitalId, receptionistId]);

  useEffect(() => {
    refreshRequestQueues();
  }, [refreshRequestQueues]);

  useEffect(() => {
    const previous = pendingRequestIdsRef.current;
    const current = new Set<string>();
    pendingRequests.forEach((request) => {
      current.add(request.id);
      if (!previous.has(request.id)) {
        notify.info(
          `${request.patient_name || "Patient"} requested an appointment${request.hospital_name ? ` at ${request.hospital_name}` : ""}.`,
          { autoClose: 4500 }
        );
      }
    });
    pendingRequestIdsRef.current = current;
  }, [pendingRequests]);

  useEffect(() => {
    if (doctors.length && !appointmentDoctorId) {
      setAppointmentDoctorId(doctors[0].id);
    }
  }, [doctors, appointmentDoctorId]);

  useEffect(() => {
    if (!printDialogOpen) {
      setSelectedInvoiceId(null);
      return;
    }
    if (invoices.length) {
      const existing = invoices.find((invoice) => invoice.id === selectedInvoiceId);
      if (!existing) {
        setSelectedInvoiceId(invoices[0].id);
      }
    }
  }, [printDialogOpen, invoices, selectedInvoiceId]);

  const upcomingAppointments = useMemo(() => {
    if (!appointments.length) return [];
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 8);

    const filtered = appointments.filter((row) => {
      const date = row.appointment_date;
      if (!date) return false;
      if (date > today) return true;
      if (date === today) {
        return row.appointment_time ? row.appointment_time >= currentTime : false;
      }
      return false;
    });

    filtered.sort((a, b) => {
      const compareDate = a.appointment_date.localeCompare(b.appointment_date);
      if (compareDate !== 0) return compareDate;
      return (a.appointment_time || "").localeCompare(b.appointment_time || "");
    });

    return filtered.slice(0, 4);
  }, [appointments]);

  const quickActions = [
    {
      label: "Walk-in Ticket",
      icon: Plus,
      action: () => setWalkInDialogOpen(true),
      variant: "default" as const,
    },
    {
      label: "Schedule Appointment",
      icon: Calendar,
      action: () => setScheduleDialogOpen(true),
      variant: "outline" as const,
    },
    {
      label: "Process Payment",
      icon: CreditCard,
      action: () => setPaymentDialogOpen(true),
      variant: "outline" as const,
    },
    {
      label: "Print Receipt",
      icon: Printer,
      action: () => handleOpenPrintDialog(),
      variant: "outline" as const,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
      case "waiting":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
          pushToast({
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

      pushToast({
        title: responseMode === "accept" ? "Appointment scheduled" : "Request declined",
        description:
          responseMode === "accept"
            ? "The patient and doctor have been notified."
            : "The patient has been informed of the decision.",
      });

      setRespondDialogOpen(false);
      await refreshRequestQueues();
    } catch (error: any) {
      pushToast({
        title: "Action failed",
        description: error?.message || "Unable to process the request right now.",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh] text-slate-500">Loading dashboard…</div>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-red-600">
        <AlertCircle className="w-8 h-8" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-purple-500 to-blue-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome back, {receptionistName.split(" ")[0]}!</h2>
                <p className="text-purple-100">
                  {stats.todayAppointments} appointments scheduled for today
                  {hospitalName ? ` · ${hospitalName}` : ""}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">₹{stats.todayPayments.toLocaleString()}</div>
                <div className="text-sm text-purple-100">Today&apos;s Collection</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: "Total Appointments",
              value: stats.todayAppointments,
              change: "+8 from yesterday",
              icon: Calendar,
              color: "text-blue-600",
              bg: "bg-blue-100",
            },
            {
              title: "Walk-in Patients",
              value: stats.todayWalkins,
              change: "+3 today",
              icon: Users,
              color: "text-green-600",
              bg: "bg-green-100",
            },
            {
              title: "Payments Collected",
              value: `₹${stats.todayPayments.toLocaleString()}`,
              change: "+15% from yesterday",
              icon: CreditCard,
              color: "text-purple-600",
              bg: "bg-purple-100",
            },
            {
              title: "Available Beds",
              value: stats.availableBeds,
              change: "Realtime bed occupancy",
              icon: Bed,
              color: "text-orange-600",
              bg: "bg-orange-100",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.02 }}
              className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" /> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  className="h-20 flex-col space-y-2"
                  variant={action.variant}
                  onClick={action.action}
                >
                  <action.icon className="w-6 h-6" />
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" /> Approval Queue
              </CardTitle>
              <div className="text-sm text-slate-500">
                {requestsLoading ? "Refreshing…" : `${pendingRequests.length} pending`}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Awaiting action</p>
                  <Badge variant="outline">{pendingRequests.length}</Badge>
                </div>
                {pendingRequests.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No pending appointment requests. Patients will appear here when they request a slot.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {request.patient_name || "Patient"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Preferred: {request.preferred_date ?? "Any day"} · {request.preferred_time ?? "Any time"}
                            </p>
                            {request.notes && (
                              <p className="text-xs text-slate-500 mt-1">
                                Notes: {request.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Recently confirmed</p>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    Live
                  </Badge>
                </div>
                {recentApprovals.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Once you confirm a request, it will appear here for quick reference.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentApprovals.map((request) => {
                      const scheduledDate = request.appointment_date ?? request.preferred_date ?? "Date TBC";
                      const scheduledTime = request.appointment_time ?? request.preferred_time ?? "Time TBC";
                      return (
                        <div
                          key={request.id}
                          className="p-4 border rounded-lg bg-slate-50 flex items-center justify-between gap-4"
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {request.patient_name || "Patient"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              Scheduled on {scheduledDate} · {scheduledTime}
                            </p>
                            {request.notes && (
                              <p className="text-xs text-slate-500 mt-1 truncate">
                                Notes: {request.notes}
                              </p>
                            )}
                          </div>
                          <Badge className="bg-emerald-600 text-white">Confirmed</Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Next Appointments
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => router.push("/receptionist/appointments")}>
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-slate-500">No upcoming appointments</p>
                ) : (
                  upcomingAppointments.map((appointment) => {
                    const displayName = appointment.patient_name || "Patient";
                    const doctorName = appointment.doctor
                      ? `Dr. ${appointment.doctor.firstName ?? ""} ${appointment.doctor.lastName ?? ""}`.trim()
                      : "";
                    const initials = displayName
                      .split(" ")
                      .filter(Boolean)
                      .map((part) => part[0]?.toUpperCase())
                      .join("")
                      .slice(0, 2) || "PT";
                    return (
                      <motion.div
                        key={appointment.id}
                        whileHover={{ scale: 1.01 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-800">{displayName}</div>
                            <div className="text-xs text-slate-500">{doctorName}</div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium text-sm">{appointment.appointment_time}</div>
                          <Badge className={getStatusBadge(appointment.status)}>{appointment.status}</Badge>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bed className="w-5 h-5" /> Bed Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-slate-600">
                <p>Monitor ward capacity and admissions in real time.</p>
                <Button variant="outline" className="w-full" onClick={() => router.push("/receptionist/beds")}>
                  Manage Bed Allocation
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog
        open={walkInDialogOpen}
        onOpenChange={(open) => {
          setWalkInDialogOpen(open);
          if (!open) {
            setWalkInPatientName("");
            setCreatingWalkIn(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create walk-in ticket</DialogTitle>
            <DialogDescription>Assign a ticket to patients arriving without an appointment.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="walkin-patient">Patient name</Label>
              <Input
                id="walkin-patient"
                placeholder="e.g., Aman Verma"
                value={walkInPatientName}
                onChange={(event) => setWalkInPatientName(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateWalkInTicket} disabled={creatingWalkIn}>
              {creatingWalkIn ? "Creating..." : "Create ticket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) {
            setAppointmentPatientName("");
            setAppointmentPatientId("");
            setAppointmentDoctorId("");
            setAppointmentDateInput("");
            setAppointmentTimeInput("");
            setCreatingAppointment(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule appointment</DialogTitle>
            <DialogDescription>Match the patient with an available doctor and slot.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appointment-patient-name">Patient name</Label>
                <Input
                  id="appointment-patient-name"
                  placeholder="Patient name"
                  value={appointmentPatientName}
                  onChange={(event) => setAppointmentPatientName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-patient-id">Patient ID (optional)</Label>
                <Input
                  id="appointment-patient-id"
                  placeholder="Link to existing patient"
                  value={appointmentPatientId}
                  onChange={(event) => setAppointmentPatientId(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign doctor</Label>
              <Select value={appointmentDoctorId} onValueChange={setAppointmentDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder={doctors.length ? "Select doctor" : "No doctors found"} />
                </SelectTrigger>
                <SelectContent>
                  {doctors.length === 0 && (
                    <SelectItem value="" disabled>
                      No doctors linked to this hospital.
                    </SelectItem>
                  )}
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {`${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim() || "Doctor"}
                      {doctor.specs ? ` • ${doctor.specs}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appointment-date">Date</Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={appointmentDateInput}
                  onChange={(event) => setAppointmentDateInput(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-time">Time</Label>
                <Input
                  id="appointment-time"
                  type="time"
                  value={appointmentTimeInput}
                  onChange={(event) => setAppointmentTimeInput(event.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={handleCreateAppointment} disabled={creatingAppointment}>
              {creatingAppointment ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          setPaymentDialogOpen(open);
          if (!open) {
            setPaymentPatientName("");
            setPaymentAmount("");
            setPaymentServices("");
            setCreatingInvoice(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process payment</DialogTitle>
            <DialogDescription>Capture invoice details for the patient.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="payment-patient">Patient name</Label>
              <Input
                id="payment-patient"
                placeholder="Patient on the invoice"
                value={paymentPatientName}
                onChange={(event) => setPaymentPatientName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-amount">Amount (₹)</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                value={paymentAmount}
                onChange={(event) => setPaymentAmount(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-services">Services (comma separated)</Label>
              <Textarea
                id="payment-services"
                placeholder="Consultation, X-ray, Lab tests"
                value={paymentServices}
                onChange={(event) => setPaymentServices(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateInvoice} disabled={creatingInvoice}>
              {creatingInvoice ? "Creating..." : "Create invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={printDialogOpen}
        onOpenChange={(open) => {
          setPrintDialogOpen(open);
          if (!open) {
            setSelectedInvoiceId(null);
            setInvoices([]);
            setInvoicesLoading(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Print receipt</DialogTitle>
            <DialogDescription>Select an invoice to generate a printable receipt.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {invoicesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-slate-500">No invoices available.</p>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Select invoice</Label>
                  <Select
                    value={selectedInvoiceId ?? ""}
                    onValueChange={(value) => setSelectedInvoiceId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose invoice" />
                    </SelectTrigger>
                    <SelectContent>
                      {invoices.map((invoice) => (
                        <SelectItem key={invoice.id} value={invoice.id}>
                          {invoice.invoice_number} • {invoice.patient_name} • ₹{invoice.amount.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground">
                  Printing opens a new tab with the receipt preview.
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handlePrintInvoice} disabled={invoicesLoading || !selectedInvoiceId}>
              Print receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={respondDialogOpen} onOpenChange={setRespondDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {responseMode === "accept" ? "Confirm appointment details" : "Decline appointment request"}
            </DialogTitle>
            <DialogDescription>
              {currentRequest?.patient_name || "Patient"} · {currentRequest?.hospital_name || hospitalName || "Hospital"}
            </DialogDescription>
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
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRespondDialogOpen(false)} disabled={responding}>
              Cancel
            </Button>
            <Button onClick={handleRespond} disabled={responding}>
              {responding ? "Saving..." : responseMode === "accept" ? "Confirm" : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
