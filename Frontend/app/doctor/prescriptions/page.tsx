"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Plus, Trash2, BrainCircuit, Loader, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useDoctorProfile } from "@/app/context/DoctorProfileContext";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
}

interface Patient {
    id: string;
    firstName: string;
    lastName: string;
}

interface AnalysisReport {
    summary_header: string;
    report_sections: {
        title: string;
        color: 'green' | 'yellow' | 'red';
        items: string[];
    }[];
}

export default function DoctorPrescriptionsPage() {
    const { profileData } = useDoctorProfile();
    const { toast } = useToast();

    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>("");
    const [medications, setMedications] = useState<Medication[]>([{ name: "", dosage: "", frequency: "" }]);
    const [notes, setNotes] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisReport, setAnalysisReport] = useState<AnalysisReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!profileData.id) return;
        const fetchPatients = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/doctor/${profileData.id}/patients`);
                const mapped = (response.data || []).filter((patient: any) => !!patient.id).map((patient: any) => ({
                    id: patient.id,
                    firstName: patient.firstName ?? "",
                    lastName: patient.lastName ?? "",
                }));
                setPatients(mapped);
            } catch (err) {
                console.error("Failed to fetch patients", err);
                toast({ title: "Error", description: "Could not load patient list.", variant: "destructive" });
            }
        };
        fetchPatients();
    }, [profileData.id, toast]);

    const handleMedicationChange = (index: number, field: keyof Medication, value: string) => {
        const newMedications = [...medications];
        newMedications[index][field] = value;
        setMedications(newMedications);
    };

    const addMedication = () => {
        setMedications([...medications, { name: "", dosage: "", frequency: "" }]);
    };

    const removeMedication = (index: number) => {
        const newMedications = medications.filter((_, i) => i !== index);
        setMedications(newMedications);
    };

    const handleSubmit = async (andAnalyze: boolean) => {
        if (!selectedPatientId || !profileData?.id) {
            toast({ title: "Error", description: "Please select a patient.", variant: "destructive" });
            return;
        }
        if (medications.some(m => !m.name || !m.dosage || !m.frequency)) {
            toast({ title: "Error", description: "Please fill all fields for each medication.", variant: "destructive" });
            return;
        }

        setIsSaving(true);
        setAnalysisReport(null);
        setError(null);

        const prescriptionData = {
            doctor_id: profileData.id,
            patient_id: selectedPatientId,
            medications,
            notes,
        };

        try {
            // Step 1: Save the prescription
            const saveResponse = await axios.post(`${API_URL}/api/doctor/prescriptions`, prescriptionData);
            const newPrescription = saveResponse.data.data[0];
            toast({ title: "Success", description: "Prescription saved successfully." });

            if (andAnalyze) {
                // Step 2: Trigger analysis
                setIsAnalyzing(true);
                toast({ title: "AI Analysis Started", description: "Please wait while we analyze the prescription." });
                
                const analyzeResponse = await axios.post(`${API_URL}/api/doctor/prescriptions/${newPrescription.id}/analyze`);
                setAnalysisReport(analyzeResponse.data);
                toast({ title: "Analysis Complete", description: "AI report generated below.", variant: "success" });
            }

        } catch (err: any) {
            console.error("Failed to process prescription:", err);
            const errorMessage = err.response?.data?.error || "An unexpected error occurred.";
            setError(errorMessage);
            toast({ title: "Error", description: errorMessage, variant: "destructive" });
        } finally {
            setIsSaving(false);
            setIsAnalyzing(false);
        }
    };

    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    const getRiskColorClass = (color: string) => {
        switch (color) {
            case 'red': return 'border-red-500 bg-red-50';
            case 'yellow': return 'border-yellow-500 bg-yellow-50';
            case 'green': return 'border-green-500 bg-green-50';
            default: return 'border-gray-300 bg-gray-50';
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3"><ClipboardList className="w-8 h-8"/> Create Prescription</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Patient & Medications</CardTitle></CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <Label htmlFor="patient">Select Patient</Label>
                                <Select onValueChange={setSelectedPatientId} value={selectedPatientId}>
                                    <SelectTrigger><SelectValue placeholder="Select a patient..." /></SelectTrigger>
                                    <SelectContent>
                                        {patients.map(p => <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {medications.map((med, index) => (
                                <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                                    <h4 className="font-semibold">Medication #{index + 1}</h4>
                                    {medications.length > 1 && (
                                        <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeMedication(index)}><Trash2 className="w-4 h-4 text-red-500"/></Button>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div><Label>Name</Label><Input value={med.name} onChange={e => handleMedicationChange(index, 'name', e.target.value)} placeholder="e.g., Lisinopril" /></div>
                                        <div><Label>Dosage</Label><Input value={med.dosage} onChange={e => handleMedicationChange(index, 'dosage', e.target.value)} placeholder="e.g., 10mg" /></div>
                                        <div><Label>Frequency</Label><Input value={med.frequency} onChange={e => handleMedicationChange(index, 'frequency', e.target.value)} placeholder="e.g., Once daily" /></div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" onClick={addMedication}><Plus className="w-4 h-4 mr-2"/>Add Medication</Button>

                            <div>
                                <Label htmlFor="notes">Additional Notes</Label>
                                <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Follow up in 2 weeks..." />
                            </div>
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-4">
                        <Button size="lg" variant="outline" onClick={() => handleSubmit(false)} disabled={isSaving || isAnalyzing}>
                            {isSaving && !isAnalyzing ? <Loader className="w-4 h-4 mr-2 animate-spin"/> : null} Save Only
                        </Button>
                        <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={() => handleSubmit(true)} disabled={isSaving || isAnalyzing}>
                            {isAnalyzing ? <Loader className="w-4 h-4 mr-2 animate-spin"/> : <BrainCircuit className="w-4 h-4 mr-2"/>}
                            Save and Analyze
                        </Button>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="space-y-6">
                    <Card className="sticky top-24">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BrainCircuit/> AI Analysis Report</CardTitle>
                            <CardDescription>The AI-generated patient-friendly report will appear here.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isAnalyzing && (
                                <div className="flex items-center justify-center h-48"><Loader className="w-8 h-8 animate-spin text-gray-500"/><p className="ml-4">Analyzing...</p></div>
                            )}
                            {error && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-3"><AlertTriangle className="w-6 h-6"/><div><h4 className="font-bold">Analysis Failed</h4><p className="text-sm">{error}</p></div></div>
                            )}
                            {analysisReport && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-lg text-center">{analysisReport.summary_header}</h3>
                                    {analysisReport.report_sections.map((section, i) => (
                                        <div key={i} className={`p-4 border-l-4 rounded-r-lg ${getRiskColorClass(section.color)}`}>
                                            <h4 className={`font-semibold text-md mb-2`}>{section.title}</h4>
                                            <ul className="list-disc list-inside space-y-1 text-sm">
                                                {section.items.map((item, j) => <li key={j}>{item}</li>)}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {!isAnalyzing && !analysisReport && !error && (
                                <div className="flex items-center justify-center h-48 text-gray-500">Awaiting analysis...</div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
            <Toaster />
        </motion.div>
    )
}