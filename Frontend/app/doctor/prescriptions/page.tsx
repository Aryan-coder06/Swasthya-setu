"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Plus,
  Stethoscope,
  Search,
  Pill,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  NotebookPen,
} from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useDoctorProfile } from "@/app/context/DoctorProfileContext";
import { apiRoute } from "@/config/env";

interface MedicationForm {
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
  instructions?: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface AnalysisReport {
  summary_header: string;
  report_sections: { title: string; color: "green" | "yellow" | "red"; items: string[] }[];
  disclaimers?: string[];
}

const medicationTemplates: Array<{
  id: string;
  label: string;
  description: string;
  medications: MedicationForm[];
  notes?: string;
}> = [
  {
    id: "post-mi",
    label: "Post-MI Secondary Prevention",
    description: "High-risk cardiac patient, post discharge",
    medications: [
      {
        name: "Atorvastatin 40 mg",
        dosage: "40 mg",
        frequency: "Once at night",
        instructions: "Take with evening meal. Monitor for myalgia.",
      },
      {
        name: "Metoprolol Succinate 50 mg",
        dosage: "50 mg",
        frequency: "Once daily",
        instructions: "Take after breakfast. Hold if SBP < 100 mmHg.",
      },
      {
        name: "Aspirin (EC) 75 mg",
        dosage: "75 mg",
        frequency: "Once daily",
        instructions: "Take with food to reduce gastric irritation.",
      },
    ],
    notes:
      "Continue cardiac rehab, check lipid profile and LFT at 8 weeks. Watch for bleeding, dizziness, or new muscle aches. Emergency review if chest pain recurs.",
  },
  {
    id: "hypertension",
    label: "Stage 2 Hypertension",
    description: "BP >160/100 mmHg without end-organ damage",
    medications: [
      {
        name: "Amlodipine 5 mg",
        dosage: "5 mg",
        frequency: "Once daily",
        instructions: "Take in the morning. Evaluate ankle swelling.",
      },
      {
        name: "Losartan 50 mg",
        dosage: "50 mg",
        frequency: "Once daily",
        instructions: "Take at night. Check renal function in 2 weeks.",
      },
    ],
    notes:
      "Encourage low-sodium diet (<5 g/day), 30 minutes brisk walk daily, monitor BP log. Red flags: severe headache, vision changes, chest pain.",
  },
  {
    id: "general",
    label: "Custom Blank Template",
    description: "Start from an empty prescription",
    medications: [{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }],
  },
];

const TRIAGE_COLORS: Record<"green" | "yellow" | "red", string> = {
  green: "bg-emerald-100 text-emerald-700",
  yellow: "bg-amber-100 text-amber-700",
  red: "bg-rose-100 text-rose-700",
};

export default function DoctorPrescriptionsPage() {
  const { profileData } = useDoctorProfile();
  const { toast } = useToast();

  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");

  const [medications, setMedications] = useState<MedicationForm[]>([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" },
  ]);
  const [notes, setNotes] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [analysisState, setAnalysisState] = useState<"idle" | "running" | "success" | "error">("idle");
  const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!profileData.id) return;
    const controller = new AbortController();

    const fetchPatients = async () => {
      try {
        const response = await axios.get(apiRoute(`/api/doctor/${profileData.id}/patients`), {
          signal: controller.signal,
        });
        const mapped = (response.data || [])
          .filter((patient: any) => !!patient.id)
          .map((patient: any) => ({
            id: patient.id,
            firstName: patient.firstName ?? "",
            lastName: patient.lastName ?? "",
          }));
        setPatients(mapped);
        if (!selectedPatientId && mapped.length) {
          setSelectedPatientId(mapped[0].id);
        }
      } catch (err) {
        if ((err as any).name === "CanceledError") return;
        console.error("Failed to fetch patients", err);
        toast({
          title: "Unable to load patients",
          description: "Try refreshing the page or check your connection.",
          variant: "destructive",
        });
      }
    };

    fetchPatients();
    return () => controller.abort();
  }, [profileData.id, selectedPatientId, toast]);

  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter((patient) => {
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      return fullName.includes(query);
    });
  }, [patients, patientSearch]);

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  );

  const handleMedicationChange = (index: number, field: keyof MedicationForm, value: string) => {
    setMedications((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMedicationRow = () => {
    setMedications((prev) => [...prev, { name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
  };

  const removeMedication = (index: number) => {
    setMedications((prev) => prev.filter((_, i) => i !== index));
  };

  const applyTemplate = (templateId: string) => {
    const template = medicationTemplates.find((item) => item.id === templateId);
    if (!template) return;
    setMedications(
      template.medications.map((med) => ({
        name: med.name || "",
        dosage: med.dosage || "",
        frequency: med.frequency || "",
        duration: med.duration || "",
        instructions: med.instructions || "",
      }))
    );
    setNotes(template.notes || "");
    toast({
      title: "Template applied",
      description: `${template.label} loaded into the prescription.`,
    });
  };

  const resetForm = () => {
    setMedications([{ name: "", dosage: "", frequency: "", duration: "", instructions: "" }]);
    setNotes("");
    setAnalysisReport(null);
    setAnalysisError(null);
    setAnalysisState("idle");
  };

  const sanitizeMedications = () =>
    medications
      .map((med) => ({
        name: med.name.trim(),
        dosage: med.dosage.trim(),
        frequency: med.frequency.trim(),
        duration: med.duration?.trim() || undefined,
        notes: med.instructions?.trim() || undefined,
      }))
      .filter((med) => med.name && med.dosage && med.frequency);

  const handleSave = async (shouldAnalyze: boolean) => {
    if (!profileData?.id || !selectedPatientId) {
      toast({
        title: "Select a patient",
        description: "Please choose a patient before saving the prescription.",
        variant: "destructive",
      });
      return;
    }

    const validatedMedications = sanitizeMedications();
    if (!validatedMedications.length || validatedMedications.length !== medications.length) {
      toast({
        title: "Missing details",
        description: "Every medication row must include a name, dosage, and frequency.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setAnalysisError(null);
    if (shouldAnalyze) {
      setAnalysisState("running");
      setAnalysisReport(null);
    }

    const payload = {
      doctor_id: profileData.id,
      patient_id: selectedPatientId,
      medications: validatedMedications,
      notes,
    };

    try {
      const saveResponse = await axios.post(apiRoute("/api/doctor/prescriptions"), payload);
      const inserted =
        Array.isArray(saveResponse.data?.data) && saveResponse.data.data.length
          ? saveResponse.data.data[0]
          : saveResponse.data?.data || saveResponse.data;

      if (!inserted?.id) {
        throw new Error("Prescription saved but response was incomplete.");
      }

      toast({
        title: "Prescription saved",
        description: selectedPatient
          ? `Saved for ${selectedPatient.firstName} ${selectedPatient.lastName}.`
          : "Prescription saved successfully.",
      });

      if (shouldAnalyze) {
        try {
          const analyzeResponse = await axios.post(
            apiRoute(`/api/doctor/prescriptions/${inserted.id}/analyze`)
          );
          setAnalysisReport(analyzeResponse.data);
          setAnalysisState("success");
          toast({
            title: "AI analysis ready",
            description: "Scroll to the right panel to review insights.",
          });
        } catch (error: any) {
          console.error("AI analysis failed", error);
          setAnalysisState("error");
          const message =
            error?.response?.data?.error ||
            error?.message ||
            "The AI service could not analyze this prescription.";
          setAnalysisError(message);
          toast({
            title: "AI analysis failed",
            description: message,
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Failed to save prescription", error);
      toast({
        title: "Save failed",
        description: error?.response?.data?.error || error?.message || "Could not save prescription.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      if (!shouldAnalyze) {
        setAnalysisState("idle");
      }
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-3xl font-bold text-gray-900">Prescription Workspace</CardTitle>
          <CardDescription>
            Build detailed prescriptions, apply templates, and let the AI highlight follow-up actions instantly.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => applyTemplate("general")}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Blank Template
          </Button>
          <Button variant="secondary" onClick={resetForm}>
            Reset Form
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px,1fr,360px]">
        {/* Patient selector */}
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-700">
              <Stethoscope className="h-5 w-5" />
              Patients
            </CardTitle>
            <CardDescription>Select a patient to attach the prescription to.</CardDescription>
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name…"
                className="pl-9"
                value={patientSearch}
                onChange={(event) => setPatientSearch(event.target.value)}
              />
            </div>
          </CardHeader>
          <Separator />
          <ScrollArea className="h-[380px]">
            <CardContent className="space-y-2">
              {filteredPatients.length === 0 ? (
                <p className="text-sm text-muted-foreground">No patients match the current search.</p>
              ) : (
                filteredPatients.map((patient) => {
                  const isActive = patient.id === selectedPatientId;
                  const initials = `${patient.firstName?.[0] ?? ""}${patient.lastName?.[0] ?? ""}`.toUpperCase();
                  return (
                    <Button
                      key={patient.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className="flex w-full items-center justify-between rounded-xl border border-emerald-100 px-4 py-3 text-left shadow-sm transition hover:border-emerald-200"
                      onClick={() => setSelectedPatientId(patient.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          {initials || "PT"}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isActive ? "Currently selected" : "Tap to select"}
                          </p>
                        </div>
                      </div>
                      {isActive && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                    </Button>
                  );
                })
              )}
            </CardContent>
          </ScrollArea>
          <Separator />
          <CardContent className="space-y-3">
            <Label className="text-xs uppercase text-muted-foreground">Recommended templates</Label>
            <div className="flex flex-col gap-2">
              {medicationTemplates
                .filter((template) => template.id !== "general")
                .map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    className="justify-start text-left"
                    onClick={() => applyTemplate(template.id)}
                  >
                    <div>
                      <p className="font-semibold text-sm">{template.label}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </Button>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Prescription builder */}
        <Card className="col-span-1 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Pill className="h-5 w-5 text-emerald-500" />
              Prescription Details
            </CardTitle>
            <CardDescription>
              Add medications with precise dosing and optional instructions for the patient.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-6">
            {medications.map((medication, index) => (
              <div key={`medication-${index}`} className="rounded-xl border border-slate-200/60 p-4 shadow-inner">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Medication #{index + 1}</h3>
                  {medications.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:text-rose-700"
                      onClick={() => removeMedication(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g., Atorvastatin 40 mg"
                      value={medication.name}
                      onChange={(event) => handleMedicationChange(index, "name", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dosage</Label>
                    <Input
                      placeholder="40 mg"
                      value={medication.dosage}
                      onChange={(event) => handleMedicationChange(index, "dosage", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Input
                      placeholder="Once daily"
                      value={medication.frequency}
                      onChange={(event) => handleMedicationChange(index, "frequency", event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (optional)</Label>
                    <Input
                      placeholder="4 weeks"
                      value={medication.duration ?? ""}
                      onChange={(event) => handleMedicationChange(index, "duration", event.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <Label>Instructions / Counselling Points</Label>
                  <Textarea
                    placeholder="E.g., Take after food, monitor pulse daily…"
                    value={medication.instructions ?? ""}
                    onChange={(event) => handleMedicationChange(index, "instructions", event.target.value)}
                  />
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addMedicationRow} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Medication
            </Button>

            <div className="space-y-2">
              <Label>Additional Notes to Patient</Label>
              <Textarea
                placeholder="Lifestyle advice, red flags, follow-up instructions…"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
              />
            </div>

            <Separator />

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                AI analysis reviews drug interactions, dosage safety, and pending concerns.
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={isSaving || analysisState === "running"}
                  onClick={() => handleSave(false)}
                >
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Only
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSaving || analysisState === "running"}
                  onClick={() => handleSave(true)}
                >
                  {analysisState === "running" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Save &amp; Analyze
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI analysis panel */}
        <Card className="border-indigo-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-700">
              <NotebookPen className="h-5 w-5" />
              AI Analysis Report
            </CardTitle>
            <CardDescription>
              Highlights unresolved issues, adherence gaps, and future recommendations based on the prescription.
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-muted-foreground">Status:</span>
              {analysisState === "idle" && (
                <Badge variant="outline" className="bg-slate-100">
                  Awaiting analysis
                </Badge>
              )}
              {analysisState === "running" && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  Reviewing…
                </Badge>
              )}
              {analysisState === "success" && (
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Complete
                </Badge>
              )}
              {analysisState === "error" && (
                <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Failed
                </Badge>
              )}
            </div>

            {analysisState === "running" && (
              <div className="rounded-lg border border-dashed border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                The assistant is analysing medication safety, duplicate therapies, and pending concerns. This takes a few
                seconds.
              </div>
            )}

            {analysisState === "error" && analysisError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p className="flex items-center gap-2 font-semibold">
                  <ShieldAlert className="h-4 w-4" />
                  Analysis failed
                </p>
                <p className="mt-1 text-xs text-rose-600">{analysisError}</p>
              </div>
            )}

            {analysisReport && (
              <div className="space-y-4">
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-4">
                  <h3 className="text-sm font-semibold text-indigo-800">{analysisReport.summary_header}</h3>
                </div>
                <div className="space-y-3">
                  {analysisReport.report_sections?.map((section) => (
                    <div key={section.title} className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-900">{section.title}</h4>
                        <Badge className={TRIAGE_COLORS[section.color]}>
                          {section.color === "red" ? "Critical" : section.color === "yellow" ? "Attention" : "Info"}
                        </Badge>
                      </div>
                      <ul className="mt-3 space-y-1 text-sm text-gray-700">
                        {section.items?.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {analysisReport.disclaimers?.length ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-muted-foreground">
                    {analysisReport.disclaimers.join(" ")}
                  </div>
                ) : null}
              </div>
            )}

            {!analysisReport && analysisState === "idle" && (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-muted-foreground">
                Save the prescription to enable the AI assistant. Attach advice or red flags to help the patient stay on
                track.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </motion.div>
  );
}
