"use client";

import { useState, useRef, useEffect } from "react";
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
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

// ---------------- Types matching FastAPI ----------------

type RiskColor = "red" | "yellow" | "green";

interface AIMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
  otc?: boolean; // backend enforces OTC-only
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
  };
  history?: Array<{ role: "user" | "ai"; content: string }>;
}

interface ChatSendResponse {
  status: "success" | "error";
  message: string;
  data?: {
    session_id: string;
    ai: AIBlock;
  };
}

// ---------------- UI-local message model ----------------

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;            // user messages = typed text, AI messages = ai.reply_markdown
  timestamp: Date;
  ai?: AIBlock | null;        // available when type === 'ai'
}

// ---------------- Component ----------------

export default function AIConsultationPage() {
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
          "This is not a medical diagnosis. For serious conditions, seek urgent care."
        ]
      }
    }
  ]);

  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null); // keep continuity across turns
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") || "http://127.0.0.1:8000";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Helpers to render colored badges
  const triageBadge = (level: RiskColor) => {
    const map: Record<RiskColor, string> = {
      red: "bg-red-100 text-red-800",
      yellow: "bg-yellow-100 text-yellow-800",
      green: "bg-green-100 text-green-800"
    };
    const label: Record<RiskColor, string> = {
      red: "High Priority",
      yellow: "Caution",
      green: "General"
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
      "Note: Informational only. Consult a qualified doctor for diagnosis/treatment."
    ].join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Prescription copied to clipboard." });
  };

  const handleDownloadPrescription = (p: AIPrescription) => {
    // Simple text download (you can swap for PDF later)
    const blob = new Blob(
      [JSON.stringify(p, null, 2)],
      { type: "application/json;charset=utf-8" }
    );
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

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // 1) append user bubble
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages((prev) => [...prev, userMsg]);

    const toSend = inputMessage; // snapshot
    setInputMessage("");
    setIsTyping(true);

    try {
      // 2) call backend
      const body: ChatSendBody = {
        session_id: sessionId || undefined,
        user_message: toSend,
        // You can pass more context later from profile:
        patient_context: { country: "IN" },
        history: messages.map((m) => ({
          role: m.type,
          content: m.type === "ai" ? (m.ai?.reply_markdown ?? m.content) : m.content
        }))
      };

      const res = await fetch(`${apiBase}/chat/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      const json: ChatSendResponse = await res.json();

      if (!res.ok || json.status !== "success" || !json.data) {
        const errMsg =
          (json as any)?.detail?.error ||
          (json as any)?.detail?.msg ||
          json.message ||
          "Chat service error";
        throw new Error(errMsg);
      }

      // 3) store session id (sticky for the thread)
      if (!sessionId) setSessionId(json.data.session_id);

      // 4) append AI bubble
      const ai = json.data.ai;
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        type: "ai",
        content: ai.reply_markdown,
        timestamp: new Date(),
        ai
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e: any) {
      toast({
        title: "Chat failed",
        description: e.message || "Could not reach AI service.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  };

  const quickSymptoms = [
    "I have a headache",
    "I'm experiencing fever",
    "I have a persistent cough",
    "I have stomach pain",
    "I feel dizzy",
    "I have chest pain"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Health Consultation</h1>
          <p className="text-gray-600 mt-1">Get instant health education and OTC guidance</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <Bot className="w-4 h-4 mr-1" />
          AI Assistant Online
        </Badge>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Quick Symptoms */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Symptoms</CardTitle>
              <CardDescription>Click to quickly describe your symptoms</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {quickSymptoms.map((symptom, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left h-auto py-2 px-3"
                  onClick={() => setInputMessage(symptom)}
                >
                  {symptom}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-4">
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

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                AI Health Assistant
              </CardTitle>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              <AnimatePresence>
                {messages.map((message) => {
                  const isUser = message.type === "user";
                  const ai = message.ai;

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex space-x-3 max-w-[80%] ${
                          isUser ? "flex-row-reverse space-x-reverse" : ""
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback
                            className={isUser ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}
                          >
                            {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                          </AvatarFallback>
                        </Avatar>

                        <div
                          className={`rounded-lg p-4 ${
                            isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {/* Bubble content */}
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>

                          {/* AI extras */}
                          {!isUser && ai && (
                            <div className="mt-3 space-y-3">
                              {/* Triage + red flags */}
                              <div className="flex items-center gap-2">
                                {triageBadge(ai.triage_level)}
                                {ai.red_flags?.length ? (
                                  <div className="flex items-center gap-1 text-red-700 text-xs">
                                    <ShieldAlert className="w-4 h-4" />
                                    {ai.red_flags[0]}
                                    {ai.red_flags.length > 1 ? ` (+${ai.red_flags.length - 1} more)` : ""}
                                  </div>
                                ) : null}
                              </div>

                              {/* Education points */}
                              {ai.education_points?.length ? (
                                <div className="bg-white border rounded-lg p-3">
                                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    What to know
                                  </h4>
                                  <ul className="space-y-1">
                                    {ai.education_points.map((pt, idx) => (
                                      <li key={idx} className="text-sm text-gray-700 flex items-start">
                                        <CheckCircle className="w-3 h-3 text-emerald-500 mr-2 mt-0.5 flex-shrink-0" />
                                        {pt}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : null}

                              {/* Prescription (OTC only) */}
                              {ai.prescription && ai.prescription.medicines?.length ? (
                                <div className="p-4 bg-white rounded-lg border">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                      <Pill className="w-4 h-4" />
                                      AI Prescription (OTC)
                                    </h4>
                                    <div className="flex space-x-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleCopyPrescription(ai.prescription!)}
                                      >
                                        <Copy className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDownloadPrescription(ai.prescription!)}
                                      >
                                        <Download className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div>
                                      <h5 className="font-medium text-gray-700 mb-2">Medicines:</h5>
                                      <div className="space-y-2">
                                        {ai.prescription.medicines.map((med, idx) => (
                                          <div key={idx} className="bg-blue-50 p-2 rounded text-sm">
                                            <div className="font-medium">
                                              {med.name}{" "}
                                              {med.otc ? (
                                                <span className="ml-2 text-xxs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                                  OTC
                                                </span>
                                              ) : null}
                                            </div>
                                            <div className="text-gray-600">
                                              {med.dosage || "-"} • {med.frequency || "-"} • {med.duration || "-"}
                                              {med.notes ? <> • {med.notes}</> : null}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {ai.prescription.advice?.length ? (
                                      <div>
                                        <h5 className="font-medium text-gray-700 mb-2">General Advice:</h5>
                                        <ul className="space-y-1">
                                          {ai.prescription.advice.map((advice, idx) => (
                                            <li
                                              key={idx}
                                              className="text-sm text-gray-600 flex items-start"
                                            >
                                              <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                              {advice}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    ) : null}

                                    <div className="bg-yellow-50 p-3 rounded">
                                      <h5 className="font-medium text-yellow-800 mb-1 flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        Follow-up:
                                      </h5>
                                      <p className="text-sm text-yellow-700">
                                        {ai.prescription.follow_up || "—"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : null}

                              {/* Disclaimers */}
                              {ai.disclaimers?.length ? (
                                <div className="text-xs text-gray-500">
                                  {ai.disclaimers.map((d, i) => (
                                    <div key={i} className="mt-1">• {d}</div>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          )}

                          <div className="text-xxs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex space-x-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-green-100 text-green-600">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Input */}
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Describe your symptoms..."
                  onKeyDown={(e) => e.key === "Enter" && !isTyping && handleSendMessage()}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isTyping}
                  className="healthcare-gradient"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}