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
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  prescription?: {
    medicines: Array<{
      name: string;
      dosage: string;
      frequency: string;
      duration: string;
    }>;
    advice: string[];
    followUp: string;
  };
}

export default function AIConsultationPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: "Hello! I'm your AI Health Assistant. I can help you understand your symptoms, provide general health advice, and generate preliminary prescriptions. Please describe your symptoms or health concerns.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const aiResponses = {
    "headache": {
      content: "Based on your symptoms of headache, here are some possible causes and recommendations:",
      prescription: {
        medicines: [
          { name: "Paracetamol", dosage: "500mg", frequency: "Twice daily", duration: "3 days" },
          { name: "Ibuprofen", dosage: "400mg", frequency: "As needed", duration: "Max 3 days" }
        ],
        advice: [
          "Stay hydrated - drink plenty of water",
          "Get adequate rest and sleep",
          "Avoid bright lights and loud noises",
          "Apply cold compress to forehead",
          "Avoid stress and practice relaxation techniques"
        ],
        followUp: "If headache persists for more than 3 days or worsens, please consult a doctor immediately."
      }
    },
    "fever": {
      content: "I understand you're experiencing fever. Here's what I recommend:",
      prescription: {
        medicines: [
          { name: "Paracetamol", dosage: "650mg", frequency: "Every 6 hours", duration: "5 days" },
          { name: "ORS Solution", dosage: "1 packet", frequency: "As needed", duration: "Until fever subsides" }
        ],
        advice: [
          "Rest and avoid physical exertion",
          "Drink plenty of fluids",
          "Use light clothing and blankets",
          "Take lukewarm baths",
          "Monitor temperature regularly"
        ],
        followUp: "Seek immediate medical attention if fever exceeds 103°F or persists beyond 3 days."
      }
    },
    "cough": {
      content: "For your cough symptoms, here are my recommendations:",
      prescription: {
        medicines: [
          { name: "Dextromethorphan", dosage: "15mg", frequency: "Three times daily", duration: "5 days" },
          { name: "Honey", dosage: "1 tablespoon", frequency: "As needed", duration: "Until symptoms improve" }
        ],
        advice: [
          "Stay hydrated with warm liquids",
          "Use a humidifier or breathe steam",
          "Avoid irritants like smoke",
          "Sleep with head elevated",
          "Gargle with warm salt water"
        ],
        followUp: "Consult a doctor if cough persists beyond 2 weeks or if you experience blood in sputum."
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const lowerInput = inputMessage.toLowerCase();
      let aiResponse: Message;

      // Simple keyword matching for demo
      if (lowerInput.includes('headache') || lowerInput.includes('head pain')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiResponses.headache.content,
          timestamp: new Date(),
          prescription: aiResponses.headache.prescription
        };
      } else if (lowerInput.includes('fever') || lowerInput.includes('temperature')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiResponses.fever.content,
          timestamp: new Date(),
          prescription: aiResponses.fever.prescription
        };
      } else if (lowerInput.includes('cough') || lowerInput.includes('cold')) {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: aiResponses.cough.content,
          timestamp: new Date(),
          prescription: aiResponses.cough.prescription
        };
      } else {
        aiResponse = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: "I understand your concern. For a more accurate diagnosis and treatment plan, I recommend describing your symptoms in more detail. You can mention symptoms like headache, fever, cough, stomach pain, etc. For serious conditions, please consult with a qualified doctor.",
          timestamp: new Date()
        };
      }

      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const handleDownloadPrescription = (prescription: any) => {
    toast({
      title: "Prescription Downloaded",
      description: "Your AI-generated prescription has been saved.",
    });
  };

  const handleCopyPrescription = (prescription: any) => {
    const prescriptionText = `
AI PRESCRIPTION
Generated on: ${new Date().toLocaleDateString()}

MEDICINES:
${prescription.medicines.map((med: any) => 
  `• ${med.name} - ${med.dosage} - ${med.frequency} for ${med.duration}`
).join('\n')}

ADVICE:
${prescription.advice.map((advice: string) => `• ${advice}`).join('\n')}

FOLLOW-UP:
${prescription.followUp}

Note: This is an AI-generated prescription for informational purposes only. Please consult a qualified doctor for proper medical advice.
    `;
    
    navigator.clipboard.writeText(prescriptionText);
    toast({
      title: "Prescription Copied",
      description: "Prescription has been copied to clipboard.",
    });
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
          <p className="text-gray-600 mt-1">Get instant health advice and preliminary prescriptions</p>
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
                This AI consultation is for informational purposes only and should not replace professional medical advice. 
                Always consult with a qualified healthcare provider for serious conditions.
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
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex space-x-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className={message.type === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}>
                          {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className={`rounded-lg p-4 ${
                        message.type === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        
                        {message.prescription && (
                          <div className="mt-4 p-4 bg-white rounded-lg border">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Pill className="w-4 h-4" />
                                AI Prescription
                              </h4>
                              <div className="flex space-x-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleCopyPrescription(message.prescription)}
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDownloadPrescription(message.prescription)}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <div>
                                <h5 className="font-medium text-gray-700 mb-2">Medicines:</h5>
                                <div className="space-y-2">
                                  {message.prescription.medicines.map((med, idx) => (
                                    <div key={idx} className="bg-blue-50 p-2 rounded text-sm">
                                      <div className="font-medium">{med.name}</div>
                                      <div className="text-gray-600">
                                        {med.dosage} • {med.frequency} • {med.duration}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h5 className="font-medium text-gray-700 mb-2">General Advice:</h5>
                                <ul className="space-y-1">
                                  {message.prescription.advice.map((advice, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 flex items-start">
                                      <CheckCircle className="w-3 h-3 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                      {advice}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="bg-yellow-50 p-3 rounded">
                                <h5 className="font-medium text-yellow-800 mb-1 flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Follow-up:
                                </h5>
                                <p className="text-sm text-yellow-700">{message.prescription.followUp}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs opacity-70 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
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
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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