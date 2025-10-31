"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  Search,
  Download,
  Eye,
  Calendar,
  Image as ImageIcon,
  File as FileIcon,
  Loader2,
  Inbox,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useRouter } from "next/navigation";
import type { PatientReport } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type RecordSource = "upload" | "ai";

// Interface for a medical record object
interface MedicalRecord {
  id: string;
  source: RecordSource;
  name: string;
  type: string;
  date: string;
  doctor: string;
  hospital: string;
  fileType: string;
  size: string;
  tags: string[];
  description: string;
  url: string;
  mimeType: string;
  aiReport?: PatientReport | null;
  aiImageUrl?: string | null;
  createdAt?: string | null;
}

export default function MedicalRecordsPage() {
  // Component State
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User and client-side rendering state
  const [userId, setUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadRecordType, setUploadRecordType] = useState("");
  const [uploadRecordDate, setUploadRecordDate] = useState("");
  const [uploadRecordDescription, setUploadRecordDescription] = useState("");
  const [uploadRecordTags, setUploadRecordTags] = useState("");

  const isAiSelected = selectedRecord?.source === "ai" && selectedRecord.aiReport;

  const recordTypes = [
    { value: "all", label: "All Records" },
    { value: "lab-test", label: "Lab Tests" },
    { value: "imaging", label: "Imaging" },
    { value: "prescription", label: "Prescriptions" },
    { value: "ai-prescription", label: "AI Prescriptions" },
    { value: "discharge", label: "Discharge Summaries" },
    { value: "test", label: "Other Tests" }
  ];

  // Helper function to get badge color based on record type
  const getTypeColor = (type: string) => {
    switch (type) {
      case "lab-test": return "bg-blue-100 text-blue-800 border-blue-200";
      case "imaging": return "bg-green-100 text-green-800 border-green-200";
      case "prescription": return "bg-purple-100 text-purple-800 border-purple-200";
      case "ai-prescription": return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "discharge": return "bg-orange-100 text-orange-800 border-orange-200";
      case "test": return "bg-pink-100 text-pink-800 border-pink-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Helper function to get the correct icon based on file type
  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case "ai":
        return <Sparkles className="w-8 h-8 text-indigo-500" />;
      case "pdf": return <FileIcon className="w-8 h-8 text-red-500" />;
      case "jpg":
      case "jpeg":
      case "png": return <ImageIcon className="w-8 h-8 text-green-500" />;
      default: return <FileText className="w-8 h-8 text-blue-500" />;
    }
  };

  // Maps file MIME type to a more readable record category
  const mapMimeToRecordType = (mimeType: string, fileType: string): string => {
    if (!mimeType || mimeType === "application/octet-stream") {
      switch (fileType.toLowerCase()) {
        case "pdf": return "lab-test";
        case "jpg":
        case "jpeg":
        case "png": return "imaging";
        default: return "test";
      }
    }
    if (mimeType.toLowerCase().includes("pdf")) return "lab-test";
    if (mimeType.toLowerCase().includes("image")) return "imaging";
    if (mimeType.toLowerCase().includes("text")) return "prescription";
    if (mimeType.toLowerCase().includes("application")) return "discharge";
    return "test";
  };

  const aiRiskStyles: Record<string, { border: string; dot: string; title: string }> = {
    red: {
      border: "border-red-200 bg-red-50",
      dot: "bg-red-500",
      title: "text-red-700",
    },
    yellow: {
      border: "border-amber-200 bg-amber-50",
      dot: "bg-amber-500",
      title: "text-amber-700",
    },
    green: {
      border: "border-emerald-200 bg-emerald-50",
      dot: "bg-emerald-500",
      title: "text-emerald-700",
    },
  };
  
  const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_');
  };

  const pdfThumbnail = "https://img.icons8.com/color/200/000000/pdf.png";

  // Effect to check for user on component mount
  useEffect(() => {
    setIsClient(true);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user.id) {
      setUserId(user.id);
    } else {
      toast({
        title: "Authentication Required",
        description: "Please sign in to view your medical records.",
        variant: "destructive",
      });
      router.push("/auth");
    }
  }, [router, toast]);
  
  // Reusable function to fetch medical documents
  const fetchRecords = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [docsResponse, aiResponse] = await Promise.all([
        axios.post(
          `${API_BASE}/profile/docs/fetch_doc`,
          { userID: userId },
          { headers: { "Content-Type": "application/json" } }
        ),
        axios
          .post(
            `${API_BASE}/patient/prescriptions/list`,
            { patientId: userId },
            { headers: { "Content-Type": "application/json" } }
          )
          .catch((error) => {
            console.error("AI report fetch error:", error);
            return { data: { data: [] } };
          }),
      ]);

      const docs = Array.isArray(docsResponse.data) ? docsResponse.data : [];
      const docRecords: MedicalRecord[] = docs.map((doc: any, index: number) => {
        const fileType = doc.path?.split(".").pop()?.toUpperCase() || "FILE";
        const mimeType = doc.type || "application/octet-stream";
        const createdAt = doc.created_at || new Date().toISOString();
        return {
          id: `upload-${doc.path || index}`,
          source: "upload",
          name: doc.path?.split("/").pop() || `Uploaded Report ${index + 1}`,
          type: mapMimeToRecordType(mimeType, fileType),
          date: createdAt.split("T")[0],
          doctor: "Self Uploaded",
          hospital: "N/A",
          fileType,
          size: doc.size ? `${(doc.size / 1024 / 1024).toFixed(1)} MB` : "Unknown",
          tags: ["Uploaded"],
          description: "User-uploaded medical report",
          url: doc.signedUrl || "",
          mimeType,
          createdAt,
        };
      });

      const aiData = Array.isArray(aiResponse?.data?.data) ? aiResponse.data.data : [];
      const aiRecords: MedicalRecord[] = aiData.map((entry: any) => {
        const parsedReport: PatientReport | null = (() => {
          if (!entry?.report) return null;
          if (typeof entry.report === "string") {
            try {
              return JSON.parse(entry.report);
            } catch (error) {
              console.warn("Failed to parse report JSON", error);
              return null;
            }
          }
          return entry.report;
        })();

        const header = parsedReport?.summary_header || entry.summary_header || "AI Prescription Summary";
        const issued = entry.date_issued || parsedReport?.date_issued || entry.created_at;

        return {
          id: `ai-${entry.id}`,
          source: "ai",
          name: header,
          type: "ai-prescription",
          date: (issued || new Date().toISOString()).split("T")[0],
          doctor: entry.doctor_name || parsedReport?.doctor_name || "AI Assisted",
          hospital: "Prescription Analyzer",
          fileType: "AI",
          size: "—",
          tags: ["AI Summary", "Prescription"],
          description: "AI-generated prescription analysis",
          url: entry.image_url || "",
          mimeType: "application/json",
          aiReport: parsedReport,
          aiImageUrl: entry.image_url || null,
          createdAt: entry.created_at || null,
        };
      });

      const combined = [...docRecords, ...aiRecords].sort((a, b) => {
        const aDate = new Date(a.createdAt || a.date).getTime();
        const bDate = new Date(b.createdAt || b.date).getTime();
        return bDate - aDate;
      });

      setMedicalRecords(combined);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast({
        title: "Failed to Fetch Records",
        description: error.response?.data?.error || "Unable to load medical records.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  // Effect to fetch documents when userId is available
  useEffect(() => {
    if (userId && isClient) {
      fetchRecords();
    }
  }, [userId, isClient, fetchRecords]);

  // Filter and search logic
  const filteredRecords = useMemo(() => {
    return medicalRecords
      .filter(record => {
        if (filterType === "all") return true;
        if (record.type === filterType) return true;
        if (filterType === "prescription" && record.type === "ai-prescription") return true;
        return false;
      })
      .filter(record => {
        if (!searchTerm) return true;
        const lowercasedTerm = searchTerm.toLowerCase();
        return (
          record.name.toLowerCase().includes(lowercasedTerm) ||
          record.description.toLowerCase().includes(lowercasedTerm) ||
          record.doctor.toLowerCase().includes(lowercasedTerm) ||
          record.hospital.toLowerCase().includes(lowercasedTerm) ||
          record.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm))
        );
      });
  }, [medicalRecords, filterType, searchTerm]);

  // Reset upload form state
  const resetUploadForm = () => {
    setSelectedFile(null);
    setUploadRecordType("");
    setUploadRecordDate("");
    setUploadRecordDescription("");
    setUploadRecordTags("");
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  // Handler for file upload
  const handleUpload = async () => {
    if (!selectedFile || !userId) {
      toast({
        title: "Missing Information",
        description: "Please select a file and ensure you are signed in.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const sanitizedFile = new File([selectedFile], sanitizeFilename(selectedFile.name), {
      type: selectedFile.type, lastModified: selectedFile.lastModified,
    });
    
    const formData = new FormData();
    formData.append("document", sanitizedFile);
    formData.append("userId", userId);
    formData.append("recordType", uploadRecordType);
    formData.append("date", uploadRecordDate);
    formData.append("description", uploadRecordDescription);
    formData.append("tags", uploadRecordTags);

    try {
      const response = await axios.post(`${API_BASE}/profile/docs/add_doc`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });

      toast({
        title: "File Uploaded!",
        description: response.data.message || "Your record has been successfully uploaded.",
      });

      await fetchRecords(); // Refetch documents to show the new one
      setShowUploadModal(false);
      resetUploadForm();
    } catch (error: any) {
        console.error("Upload error:", error);
        let errorMessage = error.response?.data?.docError || "Failed to upload report.";
        toast({ title: "Upload Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Handler for file input changes with validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({ title: "File Too Large", description: "Please select a file smaller than 10MB.", variant: "destructive" });
        return;
      }
      const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: "Unsupported File Type", description: "Please select a PDF, JPG, or PNG file.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };
  
  // Framer Motion animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      );
    }
    if (filteredRecords.length === 0) {
      return (
        <div className="text-center py-16">
          <Inbox className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Records Found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? "Try adjusting your search or filter." : "Upload a new record to get started."}
          </p>
        </div>
      );
    }
    return (
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecords.map((record) => (
          <motion.div key={record.id} variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 min-w-0">
                    {getFileIcon(record.fileType)}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate" title={record.name}>{record.name}</CardTitle>
                      <CardDescription className="truncate">{record.description}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className={`ml-2 flex-shrink-0 ${getTypeColor(record.type)}`}>
                    {recordTypes.find(t => t.value === record.type)?.label || record.type.replace('-', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow flex flex-col">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center"><Calendar className="w-4 h-4 mr-1.5" />{record.date}</span>
                  <span>{record.size}</span>
                </div>
                <div className="flex-grow space-y-2">
                  <p className="text-sm text-gray-600">Doctor: {record.doctor}</p>
                  <p className="text-sm text-gray-600">Hospital: {record.hospital}</p>
                  {record.source === "ai" && record.aiReport && (
                    <div className="mt-2 space-y-1">
                      {record.aiReport.report_sections?.slice(0, 2).map((section, idx) => (
                        <div
                          key={`${record.id}-sec-${idx}`}
                          className="rounded-md border border-indigo-100 bg-indigo-50/70 px-3 py-2 text-xs"
                        >
                          <p className="font-semibold text-indigo-700">{section.title}</p>
                          <p className="text-indigo-900/80">
                            {section.items?.[0] || "AI summary available"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {record.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedRecord(record)}>
                    <Eye className="w-3 h-3 mr-2" />View
                  </Button>
                  {record.url ? (
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <a href={record.url} target="_blank" rel="noopener noreferrer">
                        <Download className="w-3 h-3 mr-2" />Download
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1" disabled>
                      <Download className="w-3 h-3 mr-2" />Download
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    );
  };
  
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600 mt-1">Manage your medical documents and reports</p>
        </div>
        <Dialog open={showUploadModal} onOpenChange={(isOpen) => { setShowUploadModal(isOpen); if(!isOpen) resetUploadForm(); }}>
          <DialogTrigger asChild>
            <Button className="healthcare-gradient" disabled={!isClient || !userId}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Medical Record</DialogTitle>
              <DialogDescription>
                Select a file and provide details about the record.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-2">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {selectedFile ? (
                    <div>
                        <p className="text-lg font-medium text-gray-900 mb-2 truncate">{selectedFile.name}</p>
                        <p className="text-gray-600">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-lg font-medium text-gray-900 mb-2">Click to browse or drop files here</p>
                        <p className="text-gray-600">Supports PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recordType">Record Type</Label>
                  <Select value={uploadRecordType} onValueChange={setUploadRecordType}>
                    <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lab-test">Lab Test</SelectItem>
                      <SelectItem value="imaging">Imaging</SelectItem>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="discharge">Discharge Summary</SelectItem>
                      <SelectItem value="test">Other Test</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Date of Record</Label>
                  <Input type="date" value={uploadRecordDate} onChange={e => setUploadRecordDate(e.target.value)} />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input placeholder="e.g., Annual blood test results" value={uploadRecordDescription} onChange={e => setUploadRecordDescription(e.target.value)} />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (Optional, comma-separated)</Label>
                <Input placeholder="e.g., Blood Work, Routine, Cardiology" value={uploadRecordTags} onChange={e => setUploadRecordTags(e.target.value)} />
              </div>
              
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={isUploading}>Cancel</Button>
                <Button onClick={handleUpload} className="healthcare-gradient" disabled={!selectedFile || isUploading}>
                  {isUploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isUploading ? "Uploading..." : "Upload Record"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="relative flex-grow">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search records..." 
              className="pl-10 w-full" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {recordTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-gray-600 self-end md:self-center">
          Showing {filteredRecords.length} of {medicalRecords.length} records
        </div>
      </motion.div>

      {renderContent()}

      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate pr-4">{selectedRecord?.name}</span>
              {selectedRecord?.url ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={selectedRecord?.url} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4 mr-2" />Download
                  </a>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  <Download className="w-4 h-4 mr-2" />Download
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>{selectedRecord?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium text-gray-800">Date:</span> {selectedRecord?.date}</div>
              <div><span className="font-medium text-gray-800">Type:</span> {recordTypes.find(t => t.value === selectedRecord?.type)?.label || selectedRecord?.type}</div>
              <div><span className="font-medium text-gray-800">Doctor:</span> {selectedRecord?.doctor}</div>
              <div><span className="font-medium text-gray-800">Hospital:</span> {selectedRecord?.hospital}</div>
            </div>
            {isAiSelected && selectedRecord?.aiReport ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  {selectedRecord.aiReport.report_sections?.map((section, idx) => {
                    const style = aiRiskStyles[section.color] || aiRiskStyles.green;
                    return (
                      <div
                        key={`${selectedRecord.id}-section-${idx}`}
                        className={`rounded-lg border ${style.border} p-4`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                          <p className={`font-semibold ${style.title}`}>{section.title}</p>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm text-gray-700">
                          {(section.items || []).map((item, itemIdx) => (
                            <li key={`${selectedRecord.id}-section-${idx}-item-${itemIdx}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
                {selectedRecord.aiReport.raw_extracted_data && (
                  <div className="rounded-lg border bg-gray-50 p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Extracted Prescription Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                      <p><span className="font-medium">Patient:</span> {selectedRecord.aiReport.raw_extracted_data.patient_name || "Unknown"}</p>
                      <p><span className="font-medium">Doctor:</span> {selectedRecord.aiReport.raw_extracted_data.doctor_name || selectedRecord.doctor}</p>
                      <p><span className="font-medium">Hospital:</span> {selectedRecord.aiReport.raw_extracted_data.hospital_name || "—"}</p>
                      <p><span className="font-medium">Issued On:</span> {selectedRecord.aiReport.raw_extracted_data.date_issued || selectedRecord.date}</p>
                    </div>
                    {selectedRecord.aiReport.raw_extracted_data.medications && selectedRecord.aiReport.raw_extracted_data.medications.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-semibold text-gray-800">Medications</p>
                        <ul className="space-y-1 text-sm text-gray-700">
                          {selectedRecord.aiReport.raw_extracted_data.medications.map((med, medIdx) => (
                            <li key={`${selectedRecord.id}-med-${medIdx}`}>
                              <span className="font-medium">{med.name}</span>
                              {med.dosage && ` • ${med.dosage}`}
                              {med.frequency && ` • ${med.frequency}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {selectedRecord.aiImageUrl && (
                  <div className="border rounded-lg bg-gray-50 p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Original Prescription Image</p>
                    <img
                      src={selectedRecord.aiImageUrl}
                      alt="Prescription"
                      className="max-h-[60vh] w-full rounded-md object-contain"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-gray-50 flex justify-center items-center min-h-[400px]">
                {selectedRecord?.fileType?.toLowerCase() === "pdf" ? (
                    <img src={pdfThumbnail} alt="PDF Thumbnail" className="max-w-[150px] h-auto cursor-pointer" onClick={() => window.open(selectedRecord.url, "_blank")} />
                ) : ["jpg", "jpeg", "png"].includes(selectedRecord?.fileType?.toLowerCase() || "") ? (
                    <img src={selectedRecord?.url} alt={selectedRecord?.name} className="max-w-full max-h-[60vh] h-auto cursor-pointer" onClick={() => window.open(selectedRecord?.url, "_blank")} />
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto flex items-center justify-center">
                      {getFileIcon(selectedRecord?.fileType || "")}
                    </div>
                    <p className="mt-4 text-gray-600">No preview available for this file type.</p>
                    <p className="text-sm text-gray-500 mt-2">{selectedRecord?.fileType} • {selectedRecord?.size}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
