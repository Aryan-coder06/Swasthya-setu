"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function DoctorRecordsPage() {
    const [recentRecords, setRecentRecords] = useState([
        { patient: "Emma Johnson", type: "Blood Test Report", date: "2025-10-08" },
    ]);
    const [showModal, setShowModal] = useState(false);
    const { toast } = useToast();

    const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newRecord = {
          patient: formData.get("patientName") as string || "N/A",
          type: formData.get("docType") as string || "General Report",
          date: new Date().toISOString().split('T')[0]
        };
        setRecentRecords([newRecord, ...recentRecords]);
        setShowModal(false);
        toast({ title: "Success", description: "Document has been uploaded." });
    };

    return(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogTrigger asChild><Button className="bg-green-600 hover:bg-green-700"><Upload className="w-4 h-4 mr-2" />Upload Document</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Upload New Document</DialogTitle></DialogHeader>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div><Label htmlFor="patientName">Patient Name</Label><Input name="patientName" id="patientName" /></div>
                            <div><Label htmlFor="docType">Document Type</Label><Input name="docType" id="docType" placeholder="e.g., Blood Test, X-Ray"/></div>
                             <div>
                                <Label htmlFor="file">File</Label>
                                <Input id="file" type="file" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="ghost" onClick={()=>setShowModal(false)}>Cancel</Button><Button type="submit">Upload</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Search Patient Records</CardTitle>
                    <div className="relative pt-2"><Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><Input placeholder="Enter patient name or ID to find records..." className="pl-10 h-12 text-lg" /></div>
                </CardHeader>
             </Card>
             <Card>
                <CardHeader><CardTitle>Recently Added Records</CardTitle></CardHeader>
                <CardContent>
                    {recentRecords.map((rec, i) => (
                        <div key={i} className="flex items-center justify-between p-4 mb-2 border rounded-lg">
                            <div className="flex items-center gap-4">
                                <FileText className="w-6 h-6 text-gray-500" />
                                <div><p className="font-semibold">{rec.patient}</p><p className="text-sm text-gray-600">{rec.type}</p></div>
                            </div>
                            <p className="text-sm text-gray-500">{rec.date}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
            <Toaster />
        </motion.div>
    );
}

