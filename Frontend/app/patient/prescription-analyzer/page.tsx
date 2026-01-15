"use client";

import { useState } from "react";
import { motion } from "framer-motion";
// 1. CORRECTED ICON IMPORTS: Replaced UserMd and added Calendar
import { UploadCloud, FileText, Pill, Clock, Loader2, Info, Stethoscope, Calendar } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// Mock analysis result type
type AnalysisResult = {
  doctor: string;
  date: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  notes: string;
};

export default function PrescriptionAnalyzerPage() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
          toast({
              title: "Invalid File Type",
              description: "Please upload a PDF, JPG, or PNG file.",
              variant: "destructive",
          });
          return;
      }
      setSelectedFile(file);
      setAnalysisResult(null); 
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setAnalysisResult(null);

    setTimeout(() => {
      const mockResult: AnalysisResult = {
        doctor: "Dr. Kavya Nair, MD",
        date: "2025-10-13",
        medications: [
          { name: "Amoxicillin", dosage: "500mg", frequency: "Twice a day", duration: "7 days", instructions: "After meals" },
          { name: "Paracetamol", dosage: "650mg", frequency: "As needed for fever/pain", duration: "5 days", instructions: "Max 4 times a day" },
          { name: "Cetirizine", dosage: "10mg", frequency: "Once at night", duration: "10 days", instructions: "May cause drowsiness" },
        ],
        notes: "Rest well and drink plenty of fluids. Follow up in one week if symptoms persist. Avoid spicy food."
      };
      setAnalysisResult(mockResult);
      setIsLoading(false);
      toast({
        title: "Analysis Complete",
        description: "Your prescription has been successfully analyzed.",
      });
    }, 2000);
  };

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Prescription Analyzer</CardTitle>
            <CardDescription>Upload an image or PDF of your prescription to get a detailed breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <UploadCloud className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {selectedFile ? selectedFile.name : "Drop your prescription here or click to browse"}
              </p>
              <p className="text-gray-600 mb-4">Supports PDF, JPG, PNG files up to 10MB</p>
              <Input type="file" onChange={handleFileChange} className="hidden" id="file-upload" accept="image/jpeg,image/png,application/pdf" />
              <Label htmlFor="file-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                Choose File
              </Label>
            </div>
            <Button onClick={handleAnalyze} className="w-full" disabled={!selectedFile || isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Analyze Prescription
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {isLoading && (
         <motion.div variants={itemVariants} className="text-center p-8">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-600 mb-4"/>
            <p className="text-lg font-medium">Analyzing your prescription...</p>
            <p className="text-gray-600">This might take a few moments.</p>
         </motion.div>
      )}

      {analysisResult && (
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Analysis Result</CardTitle>
              <div className="text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center sm:gap-6 pt-2">
                  {/* 2. CORRECTED ICON USAGE: Replaced UserMd with Stethoscope */}
                  <div className="flex items-center gap-2"><Stethoscope className="w-4 h-4" /><span>Prescribed by: <span className="font-medium">{analysisResult.doctor}</span></span></div>
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>Date: <span className="font-medium">{analysisResult.date}</span></span></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisResult.medications.map((med, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-3">
                       <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><Pill className="w-5 h-5 text-blue-600" /></div>
                       <h3 className="text-lg font-semibold">{med.name} - <span className="text-base font-normal text-gray-700">{med.dosage}</span></h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-800"><Clock className="w-4 h-4 text-gray-500"/><strong>Frequency:</strong> {med.frequency}</div>
                      <div className="flex items-center gap-2 text-gray-800"><Calendar className="w-4 h-4 text-gray-500"/><strong>Duration:</strong> {med.duration}</div>
                    </div>
                    {med.instructions && <p className="mt-3 text-sm text-gray-600 bg-yellow-50 border border-yellow-200 p-2 rounded-md"><Info className="inline w-4 h-4 mr-2" />{med.instructions}</p>}
                  </div>
                ))}
              </div>
              
              <Separator className="my-6" />
              
              <div>
                <h3 className="text-md font-semibold mb-2">Doctor&apos;s Notes</h3>
                <p className="text-gray-700 text-sm p-3 bg-gray-50 rounded-md border">{analysisResult.notes}</p>
              </div>

            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
