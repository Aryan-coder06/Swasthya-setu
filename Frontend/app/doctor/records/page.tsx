"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  RefreshCw,
  Sparkles,
  Pill,
  Clock,
  Calendar,
  NotebookPen,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useDoctorProfile } from "@/app/context/DoctorProfileContext";
import { apiRoute } from "@/config/env";

interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  notes?: string;
  instructions?: string;
}

interface AnalysisSection {
  title: string;
  color: "green" | "yellow" | "red";
  items: string[];
}

interface AnalysisReport {
  summary_header?: string;
  report_sections?: AnalysisSection[];
  disclaimers?: string[];
}

interface DoctorRecord {
  id: string;
  patientId: string;
  patientName: string;
  medications: MedicationEntry[];
  notes?: string;
  aiAnalysis?: AnalysisReport | null;
  createdAt?: string;
}

const TRIAGE_COLORS: Record<"green" | "yellow" | "red", string> = {
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700",
};

const createClientId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "Just now";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Just now";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function DoctorRecordsPage() {
  const { profileData } = useDoctorProfile();
  const { toast } = useToast();

  const [records, setRecords] = useState<DoctorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [analyzingRecordId, setAnalyzingRecordId] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!profileData.id) return;
    try {
      setLoading(true);
      const response = await axios.get(apiRoute(`/api/doctor/${profileData.id}/records`), {
        params: { t: Date.now() },
      });
      const payload = Array.isArray(response.data) ? response.data : [];
      const normalized: DoctorRecord[] = payload.map((row: any) => ({
        id: row.id ?? row.recordId ?? createClientId(),
        patientId: row.patientId ?? row.patient_id ?? "",
        patientName: row.patientName ?? row.patient_name ?? "Patient",
        medications: Array.isArray(row.medications) ? row.medications : [],
        notes: row.notes ?? "",
        aiAnalysis: row.aiAnalysis ?? row.ai_analysis ?? null,
        createdAt: row.createdAt ?? row.created_at ?? null,
      }));
      setRecords(normalized);
    } catch (error: any) {
      console.error("Failed to load doctor records", error);
      toast({
        title: "Unable to load records",
        description: error?.response?.data?.error || error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profileData.id, toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) => {
      const matchesPatient = record.patientName?.toLowerCase().includes(term);
      const matchesMedication = record.medications.some((med) =>
        `${med.name} ${med.dosage} ${med.frequency}`.toLowerCase().includes(term)
      );
      return matchesPatient || matchesMedication;
    });
  }, [records, searchTerm]);

  const handleAnalyzeRecord = async (recordId: string) => {
    setAnalyzingRecordId(recordId);
    try {
      await axios.post(apiRoute(`/api/doctor/prescriptions/${recordId}/analyze`));
      toast({
        title: "Analysis complete",
        description: "AI insights were refreshed for this prescription.",
      });
      fetchRecords();
    } catch (error: any) {
      console.error("Failed to analyze prescription", error);
      toast({
        title: "Analysis failed",
        description: error?.response?.data?.error || error?.message || "AI assistant was unable to analyze this record.",
        variant: "destructive",
      });
    } finally {
      setAnalyzingRecordId(null);
    }
  };

  const renderMedications = (medications: MedicationEntry[]) => (
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

  const renderAnalysis = (analysis?: AnalysisReport | null) => {
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
        {analysis.report_sections?.map((section) => (
          <div key={section.title} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">{section.title}</p>
              <Badge className={TRIAGE_COLORS[section.color]}>
                {section.color === "red" ? "Critical" : section.color === "yellow" ? "Attention" : "Info"}
              </Badge>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {section.items?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {analysis.disclaimers?.length ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground">
            {analysis.disclaimers.join(" ")}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prescription Records</h1>
          <p className="text-sm text-gray-500">
            Every prescription you save appears here as a structured card with optional AI follow-ups.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchRecords}
          disabled={loading || analyzingRecordId !== null}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filter Records</CardTitle>
          <CardDescription>Search by patient name or medication to quickly find a record.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search patients, medications, or notes..."
              className="pl-10"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map((idx) => (
            <Card key={`skeleton-${idx}`} className="p-6">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <Skeleton className="mt-6 h-32 w-full" />
            </Card>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="border-dashed border-slate-200 bg-slate-50">
          <CardHeader>
            <CardTitle className="text-lg">No records yet</CardTitle>
            <CardDescription>
              Once you save prescriptions from the workspace, they’ll appear here as cards. Head to the “Prescriptions”
              tab to create your first one.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-5">
          {filteredRecords.map((record) => {
            const hasAnalysis = !!record.aiAnalysis;
            const analyzing = analyzingRecordId === record.id;
            return (
              <Card key={record.id} className="shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="text-xl text-slate-900">{record.patientName}</CardTitle>
                      <p className="text-sm text-slate-500">Updated {formatDateTime(record.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAnalyzeRecord(record.id)}
                        disabled={analyzing}
                      >
                        {analyzing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4 text-emerald-600" />
                        )}
                        {hasAnalysis ? "Re-run analysis" : "Analyze with AI"}
                      </Button>
                    </div>
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
      )}

      <Toaster />
    </motion.div>
  );
}
