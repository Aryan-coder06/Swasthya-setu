"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Plus, Search, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function ReceptionistBillingPage() {
    const [invoices, setInvoices] = useState([
        { id: "INV001", patient: "Alice Cooper", amount: "2500", status: "paid" },
        { id: "INV002", patient: "Robert King", amount: "4800", status: "pending" },
    ]);
    const [showModal, setShowModal] = useState(false);
    const { toast } = useToast();

    const handleCreateInvoice = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newInvoice = {
            id: `INV00${invoices.length + 1}`,
            patient: formData.get("patientName") as string || "N/A",
            amount: formData.get("amount") as string || "0",
            status: "pending" as "pending",
        };
        setInvoices([...invoices, newInvoice]);
        setShowModal(false);
        toast({ title: "Invoice Created", description: `Invoice ${newInvoice.id} for ₹${newInvoice.amount} has been generated.` });
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
                <Dialog open={showModal} onOpenChange={setShowModal}>
                    <DialogTrigger asChild>
                        <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-2" />Create Invoice</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create New Invoice</DialogTitle></DialogHeader>
                        <form onSubmit={handleCreateInvoice} className="space-y-4">
                            <div><Label htmlFor="patientName">Patient Name</Label><Input name="patientName" id="patientName" /></div>
                            <div><Label htmlFor="amount">Amount (₹)</Label><Input name="amount" id="amount" type="number" /></div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit">Create</Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            <Card>
                <CardHeader><div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" /><Input placeholder="Search invoice by ID or patient name..." className="pl-10" /></div></CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader><TableRow><TableHead>Invoice ID</TableHead><TableHead>Patient Name</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {invoices.map(inv => (
                                <TableRow key={inv.id}>
                                    <TableCell>{inv.id}</TableCell>
                                    <TableCell>{inv.patient}</TableCell>
                                    <TableCell className="font-semibold">₹{inv.amount}</TableCell>
                                    <TableCell><Badge className={inv.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>{inv.status}</Badge></TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm">View</Button>
                                        <Button size="sm"><Printer className="w-4 h-4" /></Button>
                                    </TableCell>
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

