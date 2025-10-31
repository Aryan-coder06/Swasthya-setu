// File Location: SWAS/Frontend/app/(routes)/patient/prescription-analyzer/page.tsx

"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  UploadCloud,
  X,
  Loader2,
  ZoomIn,
  Stethoscope,
  Calendar,
  ShieldAlert,
  Sparkles,
  ClipboardCheck,
  Activity,
  AlertTriangle,
  BookmarkPlus,
} from "lucide-react";

import { analyzePrescription, savePrescriptionReport } from "@/lib/api";
import {
  AnalysisResponse,
  PatientReport,
  PrescriptionData,
  ReportSection,
  Medication,
  RiskColor,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const RISK_META: Record<
  RiskColor,
  {
    label: string;
    badgeVariant: "destructive" | "secondary" | "default";
    border: string;
    gradient: string;
    icon: React.ReactNode;
  }
> = {
  red: {
    label: "Critical",
    badgeVariant: "destructive",
    border: "border-red-500/70",
    gradient: "from-red-500/20 via-red-500/10 to-transparent",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  yellow: {
    label: "Caution",
    badgeVariant: "secondary",
    border: "border-amber-500/70",
    gradient: "from-amber-500/20 via-amber-500/10 to-transparent",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  green: {
    label: "Wellness",
    badgeVariant: "default",
    border: "border-emerald-500/70",
    gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
};

const emphasizeInsight = (text: string, color: RiskColor) => {
  if (!text) return null;
  const match = text.match(/^(.*?)([:\-–])\s*(.*)$/);
  if (!match) {
    return <span>{text}</span>;
  }
  const [_, lead, divider, rest] = match;
  const tone =
    color === "red"
      ? "text-red-700"
      : color === "yellow"
      ? "text-amber-700"
      : "text-emerald-700";
  return (
    <span>
      <span className={`font-semibold ${tone}`}>{lead.trim()} {divider}</span>
      <span className="ml-1 text-muted-foreground">{rest.trim()}</span>
    </span>
  );
};

const SectionDisplay: React.FC<{ section: ReportSection }> = ({ section }) => {
  const meta = RISK_META[section.color];
  return (
    <Card className={`relative border ${meta.border} overflow-hidden transition-transform hover:translate-y-[-2px]`}>
      <div className={`absolute inset-0 bg-gradient-to-r ${meta.gradient}`} />
      <CardHeader className="relative space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant={meta.badgeVariant} className="flex items-center gap-1 text-xs uppercase tracking-wide">
            {meta.icon}
            {meta.label}
          </Badge>
          <span className="text-sm font-medium text-muted-foreground">{section.title}</span>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <ul className="space-y-3 text-sm leading-relaxed">
          {(section.items ?? []).map((point, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
              <span>{emphasizeInsight(point, section.color)}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

const VitalsPanel: React.FC<{ vitals?: Record<string, string> | null }> = ({ vitals }) => {
  if (!vitals || Object.keys(vitals).length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Vitals Snapshot
        </CardTitle>
        <CardDescription>Values captured from the prescription.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {Object.entries(vitals).map(([key, value]) => (
          <div key={key} className="rounded-lg border bg-muted/40 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{key}</p>
            <p className="text-sm font-semibold text-foreground">{value || "—"}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const DiseasesPanel: React.FC<{ items?: string[] | null }> = ({ items }) => {
  if (!items || items.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Diagnoses & Focus Areas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="rounded-lg border bg-white/80 px-4 py-3 shadow-sm">
            <p className="text-sm font-medium text-foreground">{item}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const MedicationGrid: React.FC<{ meds?: Medication[] | null }> = ({ meds }) => {
  if (!meds || meds.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No medications were detected in this prescription.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {meds.map((med, idx) => (
        <Card key={`${med.name}-${idx}`} className="border-muted">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span>{med.name || "Medication"}</span>
              {med.duration && (
                <Badge variant="outline" className="text-xs">
                  {med.duration}
                </Badge>
              )}
            </CardTitle>
            {med.dosage && (
              <CardDescription className="text-sm">Dosage: {med.dosage}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {med.frequency && (
              <div className="rounded-md bg-primary/5 px-3 py-2 text-primary-foreground/80">
                <span className="font-medium text-primary">Frequency:</span> {med.frequency}
              </div>
            )}
            {med.notes && (
              <div className="rounded-md bg-amber-50 px-3 py-2 text-amber-900">
                <span className="font-medium">Notes:</span> {med.notes}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const NarrativePanel: React.FC<{ title: string; body?: string | null; icon: React.ReactNode }> = ({ title, body, icon }) => {
  if (!body) return null;
  return (
    <Card className="border border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
};

const RawJsonPanel: React.FC<{ data: PrescriptionData }> = ({ data }) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Structured JSON</CardTitle>
      <CardDescription>
        Raw payload returned by the AI service (useful for debugging and manual audits).
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-[320px] rounded-md border bg-muted/40 p-4 text-xs">
        <pre className="whitespace-pre-wrap break-all text-muted-foreground">{JSON.stringify(data, null, 2)}</pre>
      </ScrollArea>
    </CardContent>
  </Card>
);

type ResultCardProps = {
  report: PatientReport;
  onSave?: () => void;
  saving?: boolean;
  canSave?: boolean;
  lastSavedAt?: string | null;
  disabledReason?: string | null;
};

const ResultCard: React.FC<ResultCardProps> = ({
  report,
  onSave,
  saving,
  canSave = true,
  lastSavedAt,
  disabledReason,
}) => {
  const orderedSections = useMemo(() => {
    const order: Record<RiskColor, number> = { red: 0, yellow: 1, green: 2 };
    return [...(report.report_sections || [])].sort((a, b) => order[a.color] - order[b.color]);
  }, [report.report_sections]);

  return (
    <Card className="border-0 bg-white shadow-xl">
      <CardHeader className="space-y-4">
        <div className="space-y-3">
          <Badge variant="outline" className="w-fit gap-2 text-xs uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            AI Generated Summary
          </Badge>
          <CardTitle className="text-3xl font-extrabold text-foreground">
            {report.summary_header || "Prescription Report"}
          </CardTitle>
          <CardDescription className="text-sm">
            Personalized insights based on the uploaded prescription. Share with your doctor or save it to revisit anytime.
          </CardDescription>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border bg-muted/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {report.doctor_name && (
              <span className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{report.doctor_name}</span>
              </span>
            )}
            {report.patient_name && (
              <span className="flex items-center gap-2">
                <BookmarkPlus className="h-4 w-4 text-primary" />
                <span>{report.patient_name}</span>
              </span>
            )}
            {report.date_issued && (
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span>{report.date_issued}</span>
              </span>
            )}
          </div>
          {onSave && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:items-end sm:text-right">
                {lastSavedAt && <span>Last saved {lastSavedAt}</span>}
                {disabledReason && !canSave && <span>{disabledReason}</span>}
              </div>
              <Button disabled={!canSave || !!saving} onClick={onSave}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Report
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="summary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {orderedSections.map((section) => (
                <SectionDisplay key={section.title} section={section} />
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <NarrativePanel
                title="Treatment Plan"
                body={report.raw_extracted_data?.treatment_notes}
                icon={<Stethoscope className="h-4 w-4 text-primary" />}
              />
              <NarrativePanel
                title="Precautions"
                body={report.raw_extracted_data?.precautions}
                icon={<ShieldAlert className="h-4 w-4 text-primary" />}
              />
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <VitalsPanel vitals={report.raw_extracted_data?.vitals ?? undefined} />
              <DiseasesPanel items={report.raw_extracted_data?.diseases_diagnoses ?? undefined} />
            </div>
            <Separator />
            <MedicationGrid meds={report.raw_extracted_data?.medications ?? undefined} />
          </TabsContent>

          <TabsContent value="raw">
            <RawJsonPanel data={report.raw_extracted_data} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const ImagePreviewModal: React.FC<{ isOpen: boolean; src: string | null; onClose: () => void }> = ({
  isOpen,
  src,
  onClose,
}) => {
  if (!isOpen || !src) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <button className="absolute right-6 top-6 text-white" aria-label="Close preview">
        <X className="h-6 w-6" />
      </button>
      <div className="max-h-[85vh] max-w-5xl overflow-hidden rounded-xl shadow-2xl">
        <img src={src} alt="Prescription Preview" className="h-full w-full object-contain" />
      </div>
    </div>
  );
};

export default function PrescriptionAnalyzerPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("user");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const id = parsed?.id || parsed?.uid || parsed?.user_id;
      if (id) {
        setPatientId(id);
      }
    } catch (error) {
      console.error("Failed to parse stored user", error);
    }
  }, []);

  useEffect(() => {
    if (patientId) return;
    const derived = (result?.report as PatientReport | null)?.raw_extracted_data?.patient_id;
    if (derived) {
      setPatientId(derived);
    }
  }, [patientId, result]);

  const handleFileChange = useCallback(
    (selectedFile: File | null) => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      if (selectedFile) {
        setFile(selectedFile);
        setImagePreviewUrl(URL.createObjectURL(selectedFile));
        setResult(null);
        setStatus("idle");
      }
    },
    [imagePreviewUrl]
  );

  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    if (selectedFile && !selectedFile.type.startsWith("image/")) {
      toast({
        title: "Unsupported file",
        description: "Please upload a JPG or PNG image.",
        variant: "destructive",
      });
      return;
    }
    handleFileChange(selectedFile);
  };

  const clearFileSelection = useCallback(() => {
    setFile(null);
    setImagePreviewUrl(null);
    setResult(null);
    setStatus("idle");
    setSaveStatus("idle");
    setLastSavedAt(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!file) {
      setStatus("error");
      setResult({ status: "error", message: "Please select an image to analyze.", report: null });
      return;
    }

    setStatus("loading");
    setSaveStatus("idle");
    setLastSavedAt(null);
    setResult(null);

    try {
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result?.toString().split(",")[1];
          if (base64String) resolve(base64String);
          else reject(new Error("Failed to read image."));
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });

      const response = await analyzePrescription(base64Image);
      setResult(response);
      setStatus(response.status === "success" ? "success" : "error");
      if (response.status === "success") {
        toast({
          title: "Report ready",
          description: "We’ve generated a personalized summary for you.",
        });
      } else {
        toast({
          title: "Analysis failed",
          description: response.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Analysis Failed:", error);
      setStatus("error");
      const message = error?.message || "Unable to analyze the prescription.";
      setResult({ status: "error", message, report: null });
      toast({
        title: "Analysis failed",
        description: message,
        variant: "destructive",
      });
    }
  }, [file, toast]);

  const handleSaveReport = useCallback(async () => {
    const report = result?.report as PatientReport | null;
    if (!report) {
      toast({
        title: "Nothing to save",
        description: "Run an analysis before archiving a report.",
        variant: "destructive",
      });
      return;
    }
    if (!patientId) {
      toast({
        title: "Login required",
        description: "Sign in with a patient profile to save reports.",
        variant: "destructive",
      });
      return;
    }
    if (!file) {
      toast({
        title: "Image missing",
        description: "Keep the original prescription image selected to archive it.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaveStatus("saving");
      const response = await savePrescriptionReport({ patientId, report, file });
      if (!response.success) {
        setSaveStatus("error");
        toast({
          title: "Could not save report",
          description: response.message,
          variant: "destructive",
        });
        return;
      }
      const timestamp = new Date().toLocaleString();
      setLastSavedAt(timestamp);
      setSaveStatus("idle");
      toast({
        title: "Report archived",
        description: "Find it later under patient records.",
      });
    } catch (error: any) {
      console.error("Save prescription report failed:", error);
      setSaveStatus("error");
      toast({
        title: "Could not save report",
        description: error?.message || "Unexpected error while saving.",
        variant: "destructive",
      });
    }
  }, [file, patientId, result, toast]);

  const analyzedReport = result?.report as PatientReport | null;

  const saveDisabledReason = useMemo(() => {
    if (!analyzedReport) return "Run an analysis to enable saving.";
    if (!patientId) return "Sign in as a patient to archive this report.";
    if (!file) return "Attach the prescription image to store it with the report.";
    return null;
  }, [analyzedReport, patientId, file]);

  return (
    <div className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <header className="space-y-3 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Prescription Insight Studio
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Upload a prescription and instantly receive a structured breakdown, risk highlights, and actionable next steps tailored for you.
          </p>
        </header>

        <Card className="border-dashed border-primary/20 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Upload prescription</CardTitle>
            <CardDescription>
              JPG or PNG up to 10&nbsp;MB. Clear, well-lit photos deliver the best results.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png"
              onChange={onFileSelect}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/40 p-6 text-center transition hover:border-primary hover:bg-primary/5 ${imagePreviewUrl ? "overflow-hidden" : ""}`}
            >
              {imagePreviewUrl ? (
                <div className="group relative h-full w-full">
                  <img
                    src={imagePreviewUrl}
                    alt="Prescription Preview"
                    className="h-full w-full rounded-xl object-contain"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/50">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="scale-95 opacity-0 transition group-hover:scale-100 group-hover:opacity-100"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsPreviewOpen(true);
                      }}
                    >
                      <ZoomIn className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-3 top-3 h-9 w-9 rounded-full bg-white/90 shadow"
                    onClick={(event) => {
                      event.stopPropagation();
                      clearFileSelection();
                    }}
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <UploadCloud className="h-12 w-12" />
                  <div>
                    <p className="text-base font-semibold text-foreground">Drop your prescription here</p>
                    <p className="text-sm">or click to browse files</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-muted-foreground">
                Your file stays on this device until you choose to analyze or save it.
              </span>
              <Button
                className="w-full sm:w-auto"
                onClick={handleAnalyze}
                disabled={!file || status === "loading"}
              >
                {status === "loading" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {status === "loading" ? "Analyzing" : "Analyze prescription"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div>
          {status === "success" && result?.report && (
            <ResultCard
              report={result.report as PatientReport}
              onSave={handleSaveReport}
              saving={saveStatus === "saving"}
              canSave={!saveDisabledReason}
              disabledReason={saveDisabledReason}
              lastSavedAt={lastSavedAt}
            />
          )}
          {status === "error" && result?.message && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="flex items-start gap-3 py-6 text-sm">
                <ShieldAlert className="mt-1 h-5 w-5 text-destructive" />
                <div>
                  <p className="font-semibold text-destructive">Analysis failed</p>
                  <p className="text-muted-foreground">{result.message}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <ImagePreviewModal isOpen={isPreviewOpen} src={imagePreviewUrl} onClose={() => setIsPreviewOpen(false)} />
    </div>
  );
}
