"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Tag,
  X,
  Plus,
  Image,
  File as FileIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { useRouter } from "next/navigation";

interface MedicalRecord {
  id: number;
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
}

export default function MedicalRecordsPage() {
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();
  const router = useRouter();

  // State for user ID and loading
  const [userId, setUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // State for uploaded file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // State for fetched documents
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);

  const recordTypes = [
    { value: "all", label: "All Records" },
    { value: "lab-test", label: "Lab Tests" },
    { value: "imaging", label: "Imaging" },
    { value: "prescription", label: "Prescriptions" },
    { value: "discharge", label: "Discharge Summaries" },
    { value: "test", label: "Other Tests" }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lab-test": return "bg-blue-100 text-blue-800";
      case "imaging": return "bg-green-100 text-green-800";
      case "prescription": return "bg-purple-100 text-purple-800";
      case "discharge": return "bg-orange-100 text-orange-800";
      case "test": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf": return <FileIcon className="w-8 h-8 text-red-500" />;
      case "jpg":
      case "jpeg":
      case "png": return <Image className="w-8 h-8 text-green-500" />;
      default: return <FileText className="w-8 h-8 text-blue-500" />;
    }
  };

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

  // Sanitize filename to avoid invalid characters
  const sanitizeFilename = (filename: string): string => {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\s+/g, '_');
  };

  // Placeholder thumbnail for PDFs
  const pdfThumbnail = "https://img.icons8.com/color/200/000000/pdf.png";

  // Initialize userId on client side
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setUserId(user.id || null);
    }
  }, []);

  // Fetch documents when userId is available
  useEffect(() => {
    if (!userId || !isClient) {
      if (!userId && isClient) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to view your medical records.",
          variant: "destructive",
        });
        router.push("/auth");
      }
      return;
    }

    const fetchDocuments = async () => {
      try {
        const response = await axios.post(
          "http://localhost:5000/profile/docs/fetch_doc",
          { userID: userId },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        console.log("Fetch Response:", JSON.stringify(response.data, null, 2));

        const docs = Array.isArray(response.data) ? response.data : [];

        const records = docs.map((doc: { signedUrl: string; type: string; path: string }, index: number) => {
          const fileType = doc.path?.split('.').pop()?.toUpperCase() || "FILE";
          const mimeType = doc.type || "application/octet-stream";

          return {
            id: index + 1,
            name: doc.path?.split('/').pop() || `Uploaded Report ${index + 1}`,
            type: mapMimeToRecordType(mimeType, fileType),
            date: new Date().toISOString().split('T')[0],
            doctor: "Self Uploaded",
            hospital: "N/A",
            fileType,
            size: "Unknown",
            tags: ["Uploaded"],
            description: "User-uploaded medical report",
            url: doc.signedUrl || "",
            mimeType,
          };
        });

        setMedicalRecords(records);
      } catch (error: any) {
        console.error("Fetch error:", error);
        toast({
          title: "Failed to Fetch Records",
          description: error.response?.data?.error || "Unable to load medical records. Please try again.",
          variant: "destructive",
        });
      }
    };

    fetchDocuments();
  }, [userId, isClient, toast, router]);

  const filteredRecords = filterType === "all"
    ? medicalRecords
    : medicalRecords.filter(record => record.type === filterType);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!userId || !isClient) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to upload medical records.",
        variant: "destructive",
      });
      router.push("/auth");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Sanitize filename
    const sanitizedFile = new File([selectedFile], sanitizeFilename(selectedFile.name), {
      type: selectedFile.type,
      lastModified: selectedFile.lastModified,
    });

    setIsUploading(true);
    const formData = new FormData();
    formData.append("document", sanitizedFile);
    formData.append("userId", userId);

    try {
      console.log("Uploading with userId:", userId, "File:", sanitizedFile.name, "Type:", sanitizedFile.type);

      const response = await axios.post("http://localhost:5000/profile/docs/add_doc", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      });
      console.log("Upload Response:", JSON.stringify(response.data, null, 2));
      toast({
        title: "File Uploaded!",
        description: response.data.message || "Your medical record has been successfully uploaded.",
      });
      setSelectedFile(null);
      setShowUploadModal(false);

      // Refresh records
      const profileResponse = await axios.post(
        "http://localhost:5000/profile/docs/fetch_doc",
        { userID: userId },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      console.log("Fetch after upload:", JSON.stringify(profileResponse.data, null, 2));
      const docs = Array.isArray(profileResponse.data) ? profileResponse.data : [];

      const records = docs.map((doc: { signedUrl: string; type: string; path: string }, index: number) => {
        const fileType = doc.path?.split('.').pop()?.toUpperCase() || "FILE";
        const mimeType = doc.type || "application/octet-stream";

        return {
          id: index + 1,
          name: doc.path?.split('/').pop() || `Uploaded Report ${index + 1}`,
          type: mapMimeToRecordType(mimeType, fileType),
          date: new Date().toISOString().split('T')[0],
          doctor: "Self Uploaded",
          hospital: "N/A",
          fileType,
          size: "Unknown",
          tags: ["Uploaded"],
          description: "User-uploaded medical report",
          url: doc.signedUrl || "",
          mimeType,
        };
      });

      setMedicalRecords(records);
    } catch (error: any) {
      console.error("Upload error:", error);
      let errorMessage = error.response?.data?.docError || error.message || "Failed to upload report. Please try again.";
      if (error.code === "ECONNABORTED") {
        errorMessage = "Upload timed out. Please check your network connection and try again.";
      } else if (errorMessage.includes("fetch failed")) {
        errorMessage = "Failed to upload to storage. Ensure the backend server is running and Supabase is configured correctly.";
      } else if (errorMessage.includes("No file provided")) {
        errorMessage = "No file was received by the server. Please select a valid file and try again.";
      }
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
        toast({
          title: "Unsupported File Type",
          description: "Please select a PDF, JPG, or PNG file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600 mt-1">Manage your medical documents and reports</p>
        </div>
        <div className="flex items-center space-x-3">
          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogTrigger asChild>
              <Button className="healthcare-gradient" disabled={!userId || isUploading || !isClient}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Medical Record</DialogTitle>
                <DialogDescription>
                  Upload your medical documents, reports, or prescriptions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Drop files here or click to browse
                  </p>
                  <p className="text-gray-600 mb-4">
                    Supports PDF, JPG, PNG files up to 10MB
                  </p>
                  <Input type="file" onChange={handleFileChange} className="mx-auto w-64" disabled={isUploading} />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowUploadModal(false)} disabled={isUploading}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpload} className="healthcare-gradient" disabled={!selectedFile || isUploading}>
                    {isUploading ? "Uploading..." : "Upload Record"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => { if (typeof window !== "undefined") { localStorage.removeItem("user"); localStorage.removeItem("session"); } router.push("/auth"); }} variant="outline">
            Logout
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search records..." className="pl-10 w-64" />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {recordTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-gray-600">
          {filteredRecords.length} records found
        </div>
      </motion.div>

      {/* Records Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredRecords.map((record) => (
          <motion.div key={record.id} variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getFileIcon(record.fileType)}
                    <div>
                      <CardTitle className="text-lg">{record.name}</CardTitle>
                      <CardDescription>{record.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getTypeColor(record.type)}>
                    {recordTypes.find(t => t.value === record.type)?.label || record.type.replace('-', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {record.date}
                  </span>
                  <span>{record.size}</span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Doctor: {record.doctor}</p>
                  <p className="text-sm text-gray-600">{record.hospital}</p>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {record.tags.map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <div className="flex space-x-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.open(record.url, "_blank")}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Preview Modal */}
      <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedRecord?.name}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(selectedRecord?.url, "_blank")}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </DialogTitle>
            <DialogDescription>
              {selectedRecord?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Date:</span> {selectedRecord?.date}
              </div>
              <div>
                <span className="font-medium">Type:</span> {recordTypes.find(t => t.value === selectedRecord?.type)?.label || selectedRecord?.type}
              </div>
              <div>
                <span className="font-medium">Doctor:</span> {selectedRecord?.doctor}
              </div>
              <div>
                <span className="font-medium">Hospital:</span> {selectedRecord?.hospital}
              </div>
            </div>
            
            <div className="border rounded-lg p-8 bg-gray-50 text-center">
              {selectedRecord?.fileType.toLowerCase() === "pdf" ? (
                <img
                  src={pdfThumbnail}
                  alt="PDF Thumbnail"
                  className="max-w-[200px] h-auto mx-auto cursor-pointer"
                  onClick={() => window.open(selectedRecord.url, "_blank")}
                  onError={() => {
                    toast({
                      title: "Failed to Load Thumbnail",
                      description: "Unable to display the PDF thumbnail.",
                      variant: "destructive",
                    });
                  }}
                />
              ) : selectedRecord?.fileType.toLowerCase() === "jpg" ||
                selectedRecord?.fileType.toLowerCase() === "jpeg" ||
                selectedRecord?.fileType.toLowerCase() === "png" ? (
                <img
                  src={selectedRecord.url}
                  alt={selectedRecord.name}
                  className="max-w-full h-auto mx-auto cursor-pointer"
                  onClick={() => window.open(selectedRecord.url, "_blank")}
                  onError={() => {
                    toast({
                      title: "Failed to Load Image",
                      description: "Unable to display the image file.",
                      variant: "destructive",
                    });
                  }}
                />
              ) : (
                <>
                  {getFileIcon(selectedRecord?.fileType || "")}
                  <p className="mt-4 text-gray-600">
                    File preview not available for this file type
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {selectedRecord?.fileType} • {selectedRecord?.size}
                  </p>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
