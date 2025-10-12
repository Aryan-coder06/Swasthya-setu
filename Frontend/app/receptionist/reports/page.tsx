"use client";

import { motion } from "framer-motion";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReceptionistReportsPage() {
    const reports = [
        { name: "Daily Appointment Summary", date: "2025-10-08" },
        { name: "Monthly Billing Report", date: "2025-10-01" },
        { name: "Patient Admission Report", date: "2025-09-30" },
    ];
    return(
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <Card>
                <CardHeader><CardTitle>Generate & Download Reports</CardTitle></CardHeader>
                <CardContent>
                    {reports.map((report, i) => (
                        <div key={i} className="flex items-center justify-between p-4 border-b">
                            <div>
                                <p className="font-semibold">{report.name}</p>
                                <p className="text-sm text-gray-500">Generated: {report.date}</p>
                            </div>
                            <Button variant="outline"><Download className="w-4 h-4 mr-2" />Download</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </motion.div>
    )
}
