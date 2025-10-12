"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";


export default function DoctorPrescriptionsPage() {
    const [prescriptions, setPrescriptions] = useState([
        { id: "PRE-001", patient: "Emma Johnson", date: "2025-10-08", medication: "Lisinopril 10mg", status: "Active" },
    ]);
    const [showModal, setShowModal] = useState(false);
    const { toast } = useToast();

    const handleCreatePrescription = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newPrescription = {
            id: `PRE-00${prescriptions.length + 1}`,
            patient: formData.get("patientName") as string || "N/A",
            date: new Date().toISOString().split('T')[0],
            medication: `${formData.get("medication") as string} ${formData.get("dosage") as string}`,
            status: "Active"
        };
        setPrescriptions([...prescriptions, newPrescription]);
        setShowModal(false);
        toast({ title: "Success", description: "Prescription created successfully." });
    };

    return(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Prescriptions</h1>
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogTrigger asChild><Button className="bg-green-600 hover:bg-green-700"><Plus className="w-4 h-4 mr-2" />Create Prescription</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create New Prescription</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreatePrescription} className="space-y-4">
                            <div><Label htmlFor="patientName">Patient Name</Label><Input name="patientName" id="patientName" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label htmlFor="medication">Medication</Label><Input name="medication" id="medication"/></div>
                                <div><Label htmlFor="dosage">Dosage</Label><Input name="dosage" id="dosage" /></div>
                            </div>
                            <div><Label htmlFor="instructions">Instructions</Label><Textarea name="instructions" id="instructions" /></div>
                            <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="ghost" onClick={()=>setShowModal(false)}>Cancel</Button><Button type="submit">Create</Button></div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
             <Card>
                <CardHeader><div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><Input placeholder="Search by patient or medication..." className="pl-10 w-full md:w-1/3" /></div></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Prescription ID</TableHead><TableHead>Patient Name</TableHead><TableHead>Date Issued</TableHead><TableHead>Medication</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {prescriptions.map((p) => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.id}</TableCell><TableCell>{p.patient}</TableCell><TableCell>{p.date}</TableCell><TableCell>{p.medication}</TableCell>
                                    <TableCell><Badge variant={p.status === 'Active' ? 'default' : 'secondary'}>{p.status}</Badge></TableCell>
                                    <TableCell className="text-right"><Button variant="outline" size="sm">View</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
             <Toaster />
        </motion.div>
    )
}

