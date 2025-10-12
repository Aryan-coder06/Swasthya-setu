"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function ReceptionistPatientPage() {
    const [patients, setPatients] = useState([
        { id: "PAT001", name: "John Smith", phone: "+91 9876543210", lastVisit: "2025-10-01" },
    ]);
    const [showModal, setShowModal] = useState(false);
    const { toast } = useToast();

    const handleRegisterPatient = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newPatient = {
            id: `PAT00${patients.length + 1}`,
            name: formData.get("patientName") as string || "N/A",
            phone: formData.get("phone") as string || "N/A",
            lastVisit: new Date().toISOString().split('T')[0],
        };
        setPatients([...patients, newPatient]);
        setShowModal(false);
        toast({ title: "Patient Registered", description: `${newPatient.name} has been added.` });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Patient Management</h1>
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-2" />Register New Patient</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Register a New Patient</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleRegisterPatient} className="space-y-4">
                            <div><Label htmlFor="patientName">Full Name</Label><Input name="patientName" id="patientName" /></div>
                            <div><Label htmlFor="phone">Phone Number</Label><Input name="phone" id="phone" type="tel" /></div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit">Register Patient</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader><div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><Input placeholder="Search patient by name, ID, or phone..." className="pl-10" /></div></CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Patient ID</TableHead><TableHead>Name</TableHead><TableHead>Phone</TableHead><TableHead>Last Visit</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {patients.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell className="font-medium">{p.id}</TableCell>
                                    <TableCell>{p.name}</TableCell>
                                    <TableCell>{p.phone}</TableCell>
                                    <TableCell>{p.lastVisit}</TableCell>
                                    <TableCell className="text-right"><Button variant="outline" size="sm">View Profile</Button></TableCell>
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

