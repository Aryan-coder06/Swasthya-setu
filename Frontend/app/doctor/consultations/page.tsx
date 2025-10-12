"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Video, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function DoctorConsultationsPage() {
    const [consultations, setConsultations] = useState([
        { id: 1, patient: "David Brown", time: "Today, 03:30 PM", status: "scheduled", avatar: "DB" },
    ]);
    const [showModal, setShowModal] = useState(false);
    const { toast } = useToast();

    const handleNewConsultation = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const patientName = formData.get("patientName") as string || "New Patient";
      const newConsult = {
        id: consultations.length + 1,
        patient: patientName,
        time: `Today, ${formData.get("time") as string || "ASAP"}`,
        status: "scheduled" as "scheduled",
        avatar: patientName.split(' ').map(n=>n[0]).join('') || 'NP'
      };
      setConsultations([...consultations, newConsult]);
      setShowModal(false);
      toast({ title: "Success", description: "New consultation scheduled." });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Consultations</h1>
                <Dialog open={showModal} onOpenChange={setShowModal}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                        <Plus className="w-4 h-4 mr-2" />
                        New Consultation
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Schedule a New Consultation</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleNewConsultation} className="space-y-4">
                      <div><Label htmlFor="patientName">Patient Name</Label><Input name="patientName" id="patientName" /></div>
                      <div><Label htmlFor="time">Time</Label><Input name="time" id="time" type="time"/></div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit">Schedule</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader><div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><Input placeholder="Search by patient name..." className="pl-10 w-full md:w-1/3" /></div></CardHeader>
                <CardContent>
                    {consultations.map((consult) => (
                         <Card key={consult.id} className="mb-4 hover:shadow-md transition-shadow">
                             <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-12 w-12"><AvatarFallback className="bg-purple-100 text-purple-600">{consult.avatar}</AvatarFallback></Avatar>
                                    <div><h3 className="font-semibold">{consult.patient}</h3><p className="text-sm text-gray-600">{consult.time}</p></div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <Badge variant={consult.status === 'completed' ? 'secondary' : 'default'}>{consult.status}</Badge>
                                    <Button><Video className="w-4 h-4 mr-2" />Start Call</Button>
                                </div>
                            </CardContent>
                         </Card>
                    ))}
                </CardContent>
            </Card>
            <Toaster />
        </motion.div>
    )
}

