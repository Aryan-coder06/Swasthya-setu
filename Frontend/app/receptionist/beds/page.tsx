"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bed, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function ReceptionistBedPage() {
    const [bedStatus, setBedStatus] = useState([
        { id: 'general', ward: "General Ward", total: 20, occupied: 15 },
        { id: 'icu', ward: "ICU", total: 8, occupied: 6 },
        { id: 'emergency', ward: "Emergency", total: 12, occupied: 8 },
        { id: 'maternity', ward: "Maternity", total: 10, occupied: 7 }
    ]);
    const [showModal, setShowModal] = useState(false);
    const { toast } = useToast();

    const handleNewAdmission = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const wardId = formData.get("ward") as string;
        
        setBedStatus(currentStatus => currentStatus.map(ward => {
            if (ward.id === wardId && ward.occupied < ward.total) {
                return { ...ward, occupied: ward.occupied + 1 };
            }
            return ward;
        }));
        
        setShowModal(false);
        toast({ title: "Admission Successful", description: `A new patient has been admitted.` });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Bed Management</h1>
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-2" />New Admission</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Process New Admission</DialogTitle></DialogHeader>
                        <form onSubmit={handleNewAdmission} className="space-y-4">
                            <div><Label htmlFor="patientName">Patient Name</Label><Input name="patientName" id="patientName" /></div>
                            <div>
                                <Label htmlFor="ward">Assign Ward</Label>
                                <Select name="ward">
                                    <SelectTrigger><SelectValue placeholder="Select a ward..." /></SelectTrigger>
                                    <SelectContent>
                                        {bedStatus.map(w => <SelectItem key={w.id} value={w.id}>{w.ward}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit">Admit Patient</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bedStatus.map((ward) => (
                    <Card key={ward.id}>
                        <CardHeader><CardTitle>{ward.ward}</CardTitle></CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-gray-600">Occupancy</p>
                                <p className="font-bold">{ward.occupied} / {ward.total}</p>
                            </div>
                            <Progress value={(ward.occupied / ward.total) * 100} />
                            <Button variant="outline" className="w-full mt-4">View Details</Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Toaster />
        </motion.div>
    );
}

