"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function ReceptionistWalkinPage() {
  const [queue, setQueue] = useState([
    { ticket: 'A01', patient: 'Anonymous Patient' },
    { ticket: 'A02', patient: 'Jane Doe' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const handleGenerateTicket = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nextTicketNumber = (queue.length > 0) ? parseInt(queue[queue.length - 1].ticket.substring(1)) + 1 : 1;
    const newTicket = {
      ticket: `A${String(nextTicketNumber).padStart(2, '0')}`,
      patient: formData.get("patientName") as string || "Anonymous Patient",
    };
    setQueue([...queue, newTicket]);
    setShowModal(false);
    toast({ title: "Ticket Generated", description: `Ticket ${newTicket.ticket} for ${newTicket.patient} has been created.` });
  };
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Walk-in Tickets</h1>
            <Dialog open={showModal} onOpenChange={setShowModal}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-2" />Generate New Ticket</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Generate Walk-in Ticket</DialogTitle></DialogHeader>
                <form onSubmit={handleGenerateTicket} className="space-y-4">
                  <div><Label htmlFor="patientName">Patient Name (Optional)</Label><Input name="patientName" id="patientName" /></div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit">Generate</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
                <CardHeader><CardTitle>Current Queue ({queue.length})</CardTitle></CardHeader>
                <CardContent>
                    {queue.length > 0 ? queue.map(p => (
                        <div key={p.ticket} className="flex items-center justify-between p-4 border-b">
                            <span className="font-bold text-lg text-purple-600">{p.ticket}</span>
                            <span className="font-medium">{p.patient}</span>
                            <Button variant="outline" size="sm">Call Next</Button>
                        </div>
                    )) : <p className="text-center text-gray-500 py-8">The queue is empty.</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Now Serving</CardTitle>
                    <CardDescription>Currently with the doctor</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-8xl font-bold text-gray-800">{queue.length > 0 ? queue[0].ticket : '---'}</p>
                    <p className="text-lg text-gray-600 mt-2">{queue.length > 0 ? queue[0].patient : 'Nobody'}</p>
                    <Button className="mt-4 w-full"><Printer className="w-4 h-4 mr-2" />Print Ticket</Button>
                </CardContent>
            </Card>
        </div>
        <Toaster />
    </motion.div>
  );
}

