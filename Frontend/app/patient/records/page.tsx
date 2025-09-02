"use client";

import { useState } from "react";
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
  File
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function MedicalRecordsPage() {
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const { toast } = useToast();

  const medicalRecords = [
    {
      id: 1,
      name: "Blood Test Report",
      type: "lab-test",
      date: "2025-01-10",
      doctor: "Dr. Sarah Wilson",
      hospital: "City General Hospital",
      fileType: "PDF",
      size: "2.4 MB",
      tags: ["Blood Work", "Routine"],
      description: "Complete blood count and lipid profile"
    },
    {
      id: 2,
      name: "Chest X-Ray",
      type: "imaging",
      date: "2025-01-08",
      doctor: "Dr. Michael Chen",
      hospital: "Metro Health Center",
      fileType: "JPG",
      size: "1.8 MB",
      tags: ["X-Ray", "Chest"],
      description: "Chest X-ray for respiratory evaluation"
    },
    {
      id: 3,
      name: "Prescription - Hypertension",
      type: "prescription",
      date: "2025-01-05",
      doctor: "Dr. Lisa Anderson",
      hospital: "Heart Care Clinic",
      fileType: "PDF",
      size: "0.5 MB",
      tags: ["Prescription", "Hypertension"],
      description: "Medication for blood pressure management"
    },
    {
      id: 4,
      name: "Discharge Summary",
      type: "discharge",
      date: "2024-12-28",
      doctor: "Dr. Robert King",
      hospital: "City General Hospital",
      fileType: "PDF",
      size: "1.2 MB",
      tags: ["Discharge", "Surgery"],
      description: "Post-operative discharge summary"
    },
    {
      id: 5,
      name: "ECG Report",
      type: "test",
      date: "2024-12-20",
      doctor: "Dr. Sarah Wilson",
      hospital: "City General Hospital",
      fileType: "PDF",
      size: "0.8 MB",
      tags: ["ECG", "Cardiology"],
      description: "Electrocardiogram test results"
    }
  ];

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
      case "pdf": return <File className="w-8 h-8 text-red-500" />;
      case "jpg":
      case "jpeg":
      case "png": return <Image className="w-8 h-8 text-green-500" />;
      default: return <FileText className="w-8 h-8 text-blue-500" />;
    }
  };

  const filteredRecords = filterType === "all" 
    ? medicalRecords 
    : medicalRecords.filter(record => record.type === filterType);

  const handleUpload = () => {
    toast({
      title: "File Uploaded!",
      description: "Your medical record has been successfully uploaded.",
    });
    setShowUploadModal(false);
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
        <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
          <DialogTrigger asChild>
            <Button className="healthcare-gradient">
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
                <Button variant="outline">
                  Choose Files
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="recordType">Record Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
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
                  <Label htmlFor="date">Date</Label>
                  <Input type="date" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Input placeholder="Brief description of the record" />
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input placeholder="e.g., Blood Work, Routine, Cardiology" />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} className="healthcare-gradient">
                  Upload Record
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
        {filteredRecords.map((record, index) => (
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
                    {record.type.replace('-', ' ')}
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
                  <Button size="sm" variant="outline" className="flex-1">
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
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{selectedRecord?.name}</span>
              <Button variant="outline" size="sm">
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
                <span className="font-medium">Type:</span> {selectedRecord?.type}
              </div>
              <div>
                <span className="font-medium">Doctor:</span> {selectedRecord?.doctor}
              </div>
              <div>
                <span className="font-medium">Hospital:</span> {selectedRecord?.hospital}
              </div>
            </div>
            
            <div className="border rounded-lg p-8 bg-gray-50 text-center">
              {getFileIcon(selectedRecord?.fileType || "")}
              <p className="mt-4 text-gray-600">
                File preview would be displayed here
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {selectedRecord?.fileType} • {selectedRecord?.size}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}