"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState([
    { id: 1, name: "Emma Johnson", age: 42, gender: "Female", lastVisit: "2025-09-15", status: "stable", avatar: "EJ" },
  ]);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const handleAddPatient = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string || "";
    const lastName = formData.get("lastName") as string || "";
    const newPatient = {
      id: patients.length + 1,
      name: `${firstName} ${lastName}`,
      age: parseInt(formData.get("age") as string) || 30,
      gender: formData.get("gender") as string || "Other",
      lastVisit: new Date().toISOString().split('T')[0],
      status: "stable" as "stable",
      avatar: `${firstName?.[0] || 'N'}${lastName?.[0] || 'P'}`
    };
    setPatients([...patients, newPatient]);
    setShowModal(false);
    toast({ title: "Success", description: `${newPatient.name} has been added to your patient list.` });
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case "stable": return "bg-green-100 text-green-800";
      case "monitoring": return "bg-blue-100 text-blue-800";
      case "critical": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Add New Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Patient</DialogTitle>
              <DialogDescription>Enter the patient's details below.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label htmlFor="firstName">First Name</Label><Input name="firstName" id="firstName" /></div>
                <div><Label htmlFor="lastName">Last Name</Label><Input name="lastName" id="lastName" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div><Label htmlFor="age">Age</Label><Input name="age" id="age" type="number" /></div>
                 <div><Label htmlFor="gender">Gender</Label><Select name="gender"><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Female">Female</SelectItem><SelectItem value="Male">Male</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit">Add Patient</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><div className="relative flex-grow"><Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><Input placeholder="Search by patient name or ID..." className="pl-10" /></div></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12"><AvatarFallback className="bg-green-100 text-green-600">{patient.avatar}</AvatarFallback></Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{patient.name}</h3>
                      <p className="text-sm text-gray-600">{patient.age}, {patient.gender}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div><p className="text-sm font-medium text-gray-500">Last Visit</p><p className="font-semibold">{patient.lastVisit}</p></div>
                    <div><p className="text-sm font-medium text-gray-500">Status</p><Badge className={getStatusColor(patient.status)}>{patient.status}</Badge></div>
                    <Button variant="outline"><FileText className="w-4 h-4 mr-2" />View Record</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </motion.div>
  );
}

