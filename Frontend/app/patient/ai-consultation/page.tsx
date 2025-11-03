"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Download,
  Copy,
  Stethoscope,
  Pill,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  MapPin,
  ClipboardList,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "../../context/ProfileContext";
import { API_BASE_URL, AI_SERVICE_URL } from "@/config/env";

type RiskColor = "red" | "yellow" | "green";

interface AIMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
  otc?: boolean;
}

interface AIPrescription {
  medicines: AIMedication[];
  advice: string[];
  follow_up?: string;
}

interface AIBlock {
  reply_markdown: string;
  triage_level: RiskColor;
  red_flags: string[];
  education_points: string[];
  prescription?: AIPrescription | null;
  disclaimers: string[];
}

interface ChatAttachmentPayload {
  kind: "image_base64" | "report_summary" | "note";
  content: string;
  title?: string;
}

interface ChatSendBody {
  session_id?: string;
  user_message: string;
  patient_context?: {
    age_years?: number;
    sex?: string;
    pregnant?: boolean;
    allergies?: string[];
    current_meds?: string[];
    chronic_conditions?: string[];
    country?: string;
    previous_reports?: string[];
  };
  history?: Array<{ role: "user" | "ai"; content: string }>;
  attachments?: ChatAttachmentPayload[];
}

interface ChatSendResponse {
  status: "success" | "error";
  message: string;
  data?: {
    session_id: string;
    ai: AIBlock;
  };
}

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  ai?: AIBlock | null;
}

interface PrescriptionRecord {
  id: string;
  summary_header?: string | null;
  report?: any;
  raw_extracted_data?: any;
  created_at?: string;
  image_url?: string | null;
}

interface ReportSummary {
  id: string;
  title: string;
  summary: string;
  highlights: string[];
  createdAtLabel: string;
  imageUrl?: string | null;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result?.toString().split(",").pop();
      if (base64String) resolve(base64String);
      else reject(new Error("Failed to encode file."));
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });

const humanizeDate = (dateString?: string | null): string => {
  if (!dateString) return "Date unknown";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Date unknown";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Date unknown";
  }
};

const summarizeReportForAI = (record: PrescriptionRecord): ReportSummary => {
  let parsedReport = record.report;
  if (typeof parsedReport === "string") {
    try {
      parsedReport = JSON.parse(parsedReport);
    } catch {
      parsedReport = null;
    }
  }

  const header =
    record.summary_header ||
    parsedReport?.summary_header ||
    "Prescription summary";

  const sections = Array.isArray(parsedReport?.report_sections)
    ? parsedReport.report_sections
    : [];

  const highlights: string[] = [];
  for (const section of sections.slice(0, 3)) {
    if (!section || typeof section !== "object") continue;
    const title: string =
      section.title || section.name || section.section_name || "Notes";
    const items: string[] = Array.isArray(section.items)
      ? (section.items as unknown[]).filter(
          (item: unknown): item is string => typeof item === "string"
        )
      : [];
    if (items.length) {
      highlights.push(`${title}: ${items.slice(0, 2).join("; ")}`);
    }
  }

  const raw = parsedReport?.raw_extracted_data ?? record.raw_extracted_data;
  if (Array.isArray(raw?.medications) && raw.medications.length) {
    const meds = raw.medications
      .slice(0, 3)
      .map((med: any) =>
        typeof med === "object" && med
          ? med.name || med.drug_name || med.medicine || ""
          : ""
      )
      .filter(Boolean);
    if (meds.length) {
      highlights.push(`Medications: ${meds.join(", ")}`);
    }
  }

  const summaryPieces = [header, ...highlights];
  const summary = summaryPieces.join(". ").slice(0, 600);

  return {
    id: record.id,
    title: header,
    summary,
    highlights,
    createdAtLabel: humanizeDate(record.created_at),
    imageUrl: record.image_url || null,
  };
};

const INITIAL_VISIBLE_REPORTS = 3;
const INITIAL_VISIBLE_HOSPITALS = 9;
const MAX_SELECTED_REPORTS = 3;

export default function AIConsultationPage() {
  const { toast } = useToast();
  const { profileData } = useProfile();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-1",
      type: "ai",
      content:
        "Hello! I'm your AI Health Assistant. I can help you understand your symptoms, provide general health education, and suggest OTC-only measures. Tell me your symptoms (e.g., fever, cough, headache). In emergencies, contact a doctor immediately.",
      timestamp: new Date(),
      ai: {
        reply_markdown:
          "Hello! I'm your AI Health Assistant. I can help you understand your symptoms, provide general health education, and suggest OTC-only measures. Tell me your symptoms (e.g., fever, cough, headache). In emergencies, contact a doctor immediately.",
        triage_level: "green",
        red_flags: [],
        education_points: [],
        prescription: null,
        disclaimers: [
          "This is not a medical diagnosis. For serious conditions, seek urgent care.",
        ],
      },
    },
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const aiServiceBase = AI_SERVICE_URL;
  const backendApiBase = API_BASE_URL;

  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [visibleReports, setVisibleReports] = useState(INITIAL_VISIBLE_REPORTS);
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

  const [imageAttachment, setImageAttachment] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const quickSymptoms = [
    "I have a headache",
    "I'm experiencing fever",
    "I have a persistent cough",
    "I have stomach pain",
    "I feel dizzy",
    "I have chest pain",
  ];

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!profileData?.id) return;
    const controller = new AbortController();
    const loadReports = async () => {
      setReportsLoading(true);
      setReportsError(null);
      try {
        const response = await fetch(`${backendApiBase}/patient/prescriptions/list`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId: profileData.id }),
          signal: controller.signal,
        });
        const json = await response.json();
        if (!response.ok) {
          throw new Error(json?.error || "Failed to load reports");
        }
        const data: PrescriptionRecord[] = Array.isArray(json.data)
          ? json.data
          : [];
        const summaries = data.map(summarizeReportForAI);
        setReports(summaries);
      } catch (error: any) {
        if (error.name !== "AbortError") {
          console.error("Failed to load reports:", error);
          setReportsError(error?.message || "Unable to load prescription reports.");
        }
      } finally {
        setReportsLoading(false);
      }
    };
    loadReports();
    return () => controller.abort();
  }, [backendApiBase, profileData?.id]);

  useEffect(() => {
    if (!imageAttachment) return;
    return () => {
      if (imageAttachment.previewUrl) {
        URL.revokeObjectURL(imageAttachment.previewUrl);
      }
    };
  }, [imageAttachment]);

  const selectedReportSummaries = useMemo(
    () =>
      reports.filter((report) => selectedReportIds.includes(report.id)),
    [reports, selectedReportIds]
  );

  const patientContext = useMemo((): ChatSendBody["patient_context"] => {
    const context: ChatSendBody["patient_context"] = {
      country: "IN",
    };
    if (selectedReportSummaries.length) {
      context.previous_reports = selectedReportSummaries.map(
        (report) => `${report.title}: ${report.summary}`
      );
    }
    return context;
  }, [selectedReportSummaries]);

  const triageBadge = (level: RiskColor) => {
    const map: Record<RiskColor, string> = {
      red: "bg-red-100 text-red-800",
      yellow: "bg-yellow-100 text-yellow-800",
      green: "bg-green-100 text-green-800",
    };
    const label: Record<RiskColor, string> = {
      red: "High Priority",
      yellow: "Caution",
      green: "General",
    };
    return <Badge className={map[level]}>{label[level]}</Badge>;
  };

  const handleCopyPrescription = (p: AIPrescription) => {
    const text = [
      "AI PRESCRIPTION (OTC-only)",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "MEDICINES:",
      ...(p.medicines || []).map(
        (m) =>
          `• ${m.name}${m.dosage ? " " + m.dosage : ""}${m.frequency ? " • " + m.frequency : ""}${
            m.duration ? " • " + m.duration : ""
          }${m.notes ? " • " + m.notes : ""}`
      ),
      "",
      "ADVICE:",
      ...(p.advice || []).map((a) => `• ${a}`),
      "",
      `FOLLOW-UP: ${p.follow_up || "-"}`,
      "",
      "Note: Informational only. Consult a qualified doctor for diagnosis/treatment.",
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Prescription copied to clipboard." });
  };

  const handleDownloadPrescription = (p: AIPrescription) => {
    const blob = new Blob([JSON.stringify(p, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai_prescription_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded", description: "Prescription saved." });
  };

  const resetComposer = () => {
    setInputMessage("");
    setImageAttachment(null);
    setAttachmentError(null);
  };

  const handleSendMessage = useCallback(async () => {
    const trimmed = inputMessage.trim();
    if (!trimmed && !imageAttachment && !selectedReportSummaries.length) {
      toast({
        title: "Add a message",
        description: "Type a question or attach a prescription to review.",
      });
      return;
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      type: "user",
      content: trimmed || "[Attachment shared]",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    setInputMessage("");
    setIsTyping(true);
    setAttachmentError(null);

    try {
      const attachments: ChatAttachmentPayload[] = [];
      if (imageAttachment) {
        const encoded = await fileToBase64(imageAttachment.file);
        attachments.push({
          kind: "image_base64",
          content: encoded,
          title: imageAttachment.file.name,
        });
      }
      if (selectedReportSummaries.length) {
        selectedReportSummaries.forEach((report) => {
          attachments.push({
            kind: "report_summary",
            content: report.summary,
            title: report.title,
          });
        });
      }

      const body: ChatSendBody = {
        session_id: sessionId || undefined,
        user_message: trimmed || "Please review the attached medical data.",
        patient_context: patientContext,
        history: messages.map((m) => ({
          role: m.type,
          content:
            m.type === "ai"
              ? m.ai?.reply_markdown ?? m.content
              : m.content,
        })),
        attachments: attachments.length ? attachments : undefined,
      };

      const response = await fetch(`${aiServiceBase}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json: ChatSendResponse = await response.json();
      if (!response.ok || json.status !== "success" || !json.data) {
        const errMsg =
          (json as any)?.detail?.error ||
          (json as any)?.detail?.msg ||
          json.message ||
          "Chat service error";
        throw new Error(errMsg);
      }

      if (!sessionId) setSessionId(json.data.session_id);

      const ai = json.data.ai;
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        type: "ai",
        content: ai.reply_markdown,
        timestamp: new Date(),
        ai,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setImageAttachment(null);
    } catch (error: any) {
      console.error("Chat failed:", error);
      toast({
        title: "Chat failed",
        description: error.message || "Could not reach AI service.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  }, [
    aiServiceBase,
    imageAttachment,
    inputMessage,
    messages,
    patientContext,
    selectedReportSummaries,
    sessionId,
    toast,
  ]);

  const quickAsk = (symptom: string) => {
    setInputMessage(symptom);
  };

  const handleAttachmentPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !files.length) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      setAttachmentError("Only image files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachmentError("Image size must be under 5 MB.");
      return;
    }
    setImageAttachment({
      file,
      previewUrl: URL.createObjectURL(file),
    });
    setAttachmentError(null);
  };

  const clearAttachment = () => {
    setImageAttachment(null);
    setAttachmentError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleReportSelection = (id: string) => {
    setSelectedReportIds((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= MAX_SELECTED_REPORTS) {
        toast({
          title: "Limit reached",
          description: `You can attach up to ${MAX_SELECTED_REPORTS} reports at once.`,
        });
        return prev;
      }
      return [...prev, id];
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <Bot className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Health Consultation</h1>
              <p className="text-gray-600">
                Chat with a medical-grade assistant, review prescriptions, and track ongoing care.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-100 text-green-800">
              <Sparkles className="w-4 h-4 mr-1" />
              Guided by your records
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              <Clock className="w-4 h-4 mr-1" />
              Typical response &lt; 5 sec
            </Badge>
          </div>
        </div>
        <Button
          variant="secondary"
          className="self-start rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() =>
            setMessages((prev) => [
              ...prev,
              {
                id: `u-${Date.now()}`,
                type: "user",
                content:
                  "Please review my past prescriptions and highlight unresolved issues or improvements.",
                timestamp: new Date(),
              },
            ])
          }
        >
          <ClipboardList className="h-4 w-4 mr-2" />
          Review my history
        </Button>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-4"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Symptoms</CardTitle>
              <CardDescription>Tap to auto-fill a common concern.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickSymptoms.map((symptom) => (
                <Button
                  key={symptom}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => quickAsk(symptom)}
                >
                  {symptom}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                Past Prescriptions
              </CardTitle>
              <CardDescription>
                Attach reports so the assistant can track progress.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportsLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading reports…
                </div>
              )}
              {reportsError && (
                <p className="text-sm text-red-600">{reportsError}</p>
              )}
              {!reportsLoading && !reportsError && reports.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Your saved AI prescription summaries will appear here once you analyse a prescription.
                </p>
              )}
              {reports.slice(0, visibleReports).map((report) => {
                const selected = selectedReportIds.includes(report.id);
                return (
                  <div
                    key={report.id}
                    className={`rounded-lg border p-3 transition ${
                      selected ? "border-emerald-500 bg-emerald-50" : "hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selected}
                            onCheckedChange={() => toggleReportSelection(report.id)}
                          />
                          <p className="font-medium text-sm text-gray-900">{report.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{report.createdAtLabel}</p>
                      </div>
                      {report.imageUrl && (
                        <a
                          href={report.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:underline"
                        >
                          View scan
                        </a>
                      )}
                    </div>
                    {report.highlights.length ? (
                      <ul className="mt-2 space-y-1 pl-6 text-xs text-muted-foreground list-disc">
                        {report.highlights.slice(0, 2).map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
              {reports.length > visibleReports && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleReports((prev) => prev + 3)}
                >
                  Show more reports
                </Button>
              )}
              {visibleReports > INITIAL_VISIBLE_REPORTS && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisibleReports(INITIAL_VISIBLE_REPORTS)}
                >
                  Show fewer
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Disclaimer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                This AI consultation is for informational purposes only and should not replace
                professional medical advice. Always consult a qualified healthcare provider for
                diagnosis and treatment, especially for urgent or severe symptoms.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <Card className="flex h-[720px] flex-col overflow-hidden">
          <CardHeader className="border-b bg-slate-50">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
              AI Health Assistant
            </CardTitle>
            <CardDescription>
              Share symptoms, attach prescriptions, and receive OTC-focused guidance.
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-white via-slate-50/60 to-white p-6">
            <AnimatePresence>
              {messages.map((message) => {
                const isUser = message.type === "user";
                const ai = message.ai;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex max-w-[85%] space-x-3 ${
                        isUser ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      <Avatar className="h-9 w-9 shadow">
                        <AvatarFallback
                          className={isUser ? "bg-blue-500 text-white" : "bg-emerald-500 text-white"}
                        >
                          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-2xl p-4 text-sm shadow ${
                          isUser
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-900 border border-emerald-100"
                        }`}
                      >
                        <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>

                        {!isUser && ai && (
                          <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-gray-700">
                            <div className="flex flex-wrap items-center gap-2">
                              {triageBadge(ai.triage_level)}
                              {ai.red_flags?.length ? (
                                <div className="flex items-center gap-1 text-red-700 text-xs">
                                  <ShieldAlert className="w-4 h-4" />
                                  {ai.red_flags[0]}
                                  {ai.red_flags.length > 1 ? ` (+${ai.red_flags.length - 1})` : ""}
                                </div>
                              ) : null}
                            </div>

                            {ai.education_points?.length ? (
                              <div className="space-y-2">
                                <h4 className="flex items-center gap-2 font-semibold text-gray-900">
                                  <FileText className="w-4 h-4 text-emerald-500" />
                                  What to know
                                </h4>
                                <ul className="space-y-1">
                                  {ai.education_points.map((pt, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-gray-700">
                                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-1" />
                                      {pt}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}

                            {ai.prescription && ai.prescription.medicines?.length ? (
                              <div className="space-y-2 rounded-lg border border-emerald-200 bg-white p-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="flex items-center gap-2 font-semibold text-emerald-700">
                                    <Pill className="w-4 h-4" />
                                    Suggested OTC medicines
                                  </h4>
                                  <div className="flex gap-2 text-xs">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCopyPrescription(ai.prescription!)}
                                    >
                                      <Copy className="w-3 h-3 mr-1" />
                                      Copy
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDownloadPrescription(ai.prescription!)}
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      Save
                                    </Button>
                                  </div>
                                </div>
                                <ul className="space-y-1 text-gray-700">
                                  {ai.prescription.medicines.map((medicine, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                      <span>
                                        <strong>{medicine.name}</strong>
                                        {medicine.dosage ? ` – ${medicine.dosage}` : ""}
                                        {medicine.frequency ? ` • ${medicine.frequency}` : ""}
                                        {medicine.duration ? ` • ${medicine.duration}` : ""}
                                        {medicine.notes ? ` • ${medicine.notes}` : ""}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                                {ai.prescription.advice?.length ? (
                                  <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                                      Advice
                                    </p>
                                    <ul className="space-y-1 text-gray-600">
                                      {ai.prescription.advice.map((tip, idx) => (
                                        <li key={idx}>• {tip}</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : null}
                                {ai.prescription.follow_up ? (
                                  <p className="text-xs text-gray-500">
                                    Follow-up: {ai.prescription.follow_up}
                                  </p>
                                ) : null}
                              </div>
                            ) : null}

                            {ai.disclaimers?.length ? (
                              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
                                {ai.disclaimers.join(" ")}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </CardContent>

          <div className="border-t bg-white p-4">
            {imageAttachment && (
              <div className="mb-3 flex items-center gap-3 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/60 p-3 text-sm text-gray-700">
                <ImageIcon className="h-5 w-5 text-emerald-600" />
                <div className="flex-1">
                  <p className="font-medium">{imageAttachment.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(imageAttachment.file.size / 1024)} KB
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={clearAttachment}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {attachmentError && (
              <p className="mb-2 text-sm text-red-600">{attachmentError}</p>
            )}

            <div className="flex items-end gap-3">
              <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm focus-within:border-emerald-400 focus-within:ring">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-emerald-600 hover:text-emerald-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={inputMessage}
                  onChange={(event) => setInputMessage(event.target.value)}
                  placeholder="Describe symptoms, ask a follow-up, or request a history review…"
                  className="border-0 bg-transparent focus-visible:ring-0"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAttachmentPick}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={isTyping}
                className="rounded-full bg-emerald-600 hover:bg-emerald-700"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" onClick={resetComposer}>
                Reset
              </Button>
            </div>
            {isTyping && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                AI is reviewing your information…
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
