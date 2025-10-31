"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Upload, Loader } from "lucide-react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useDoctorProfile } from "@/app/context/DoctorProfileContext";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface PatientRecord {
  patientId: string;
  patientName: string;
  documents: Array<{
    type: string;
    path: string;
    url: string;
  }>;
}

interface PatientOption {
  id: string;
  fullName: string;
}

export default function DoctorRecordsPage() {
  const { profileData } = useDoctorProfile();
  const { toast } = useToast();

  const [records, setRecords] = useState<PatientRecord[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");

  const fetchRecords = useCallback(async () => {
    if (!profileData.id) return;
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/doctor/${profileData.id}/records`, {
        params: { t: Date.now() },
      });
      setRecords(response.data ?? []);
    } catch (error: any) {
      console.error("Failed to fetch records", error);
      toast({
        title: "Unable to load records",
        description: error.response?.data?.error || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [profileData.id, toast]);

  const fetchPatients = useCallback(async () => {
    if (!profileData.id) return;
    try {
      const response = await axios.get(`${API_URL}/api/doctor/${profileData.id}/patients`);
      const raw = Array.isArray(response.data) ? response.data : [];
      const options: PatientOption[] = raw
        .filter((patient: any) => !!patient.id)
        .map((patient: any) => ({
          id: patient.id,
          fullName: patient.fullName || `${patient.firstName ?? ""} ${patient.lastName ?? ""}`.trim(),
        }));
      setPatients(options);
    } catch (error) {
      console.error("Failed to fetch patients", error);
    }
  }, [profileData.id]);

  useEffect(() => {
    fetchRecords();
    fetchPatients();
  }, [fetchRecords, fetchPatients]);

  const filteredRecords = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return records;
    return records.filter((record) =>
      record.patientName.toLowerCase().includes(term) ||
      record.documents.some((doc) => doc.type.toLowerCase().includes(term))
    );
  }, [records, searchTerm]);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedPatientId) {
      toast({
        title: "Select patient",
        description: "Choose who this document belongs to.",
        variant: "destructive",
      });
      return;
    }

    const inputFile = (event.currentTarget.elements.namedItem("file") as HTMLInputElement)?.files?.[0];
    if (!inputFile) {
      toast({
        title: "Attach file",
        description: "Please choose a document to upload.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("document", inputFile);
    formData.append("userId", selectedPatientId);

    try {
      setUploading(true);
      await axios.post(`${API_URL}/profile/docs/add_doc`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast({ title: "Document uploaded", description: fileName || "Record stored securely." });
      setShowModal(false);
      setSelectedPatientId("");
      setFileName("");
      (event.currentTarget as HTMLFormElement).reset();
      fetchRecords();
    } catch (error: any) {
      console.error("Failed to upload document", error);
      toast({
        title: "Upload failed",
        description: error.response?.data?.docError || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="w-4 h-4 mr-2" />Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
              <DialogDescription>Associate the file with one of your patients.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <Label>Select Patient</Label>
                <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                  <SelectTrigger>
                    <SelectValue placeholder={patients.length ? "Choose patient" : "No patients available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  name="file"
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={(event) => setFileName(event.target.files?.[0]?.name || "")}
                />
                {fileName && <p className="text-sm text-gray-500 mt-1">Selected: {fileName}</p>}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading && <Loader className="w-4 h-4 mr-2 animate-spin" />}Upload
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Search Patient Records</CardTitle>
          <div className="relative pt-2">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Enter patient name or document type..."
              className="pl-10 h-12 text-lg"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Available Records</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredRecords.length ? (
            <div className="space-y-4">
              {filteredRecords.map((record) => (
                <div key={record.patientId} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">{record.patientName}</p>
                      <p className="text-sm text-gray-500">{record.documents.length} document(s)</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {record.documents.map((doc) => (
                      <div key={doc.path} className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-md">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="font-medium">{doc.type || "Document"}</p>
                            <p className="text-xs text-gray-500 break-all">{doc.path}</p>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-green-600 hover:underline"
                        >
                          View
                        </a>
                      </div>
                    ))}
                    {record.documents.length === 0 && (
                      <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">No records available yet.</p>
          )}
        </CardContent>
      </Card>
      <Toaster />
    </motion.div>
  );
}
