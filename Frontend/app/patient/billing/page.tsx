"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Download,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  TrendingUp,
  DollarSign,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function BillingPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const transactions = [
    {
      id: "TXN001",
      date: "2025-01-10",
      hospital: "City General Hospital",
      doctor: "Dr. Ananya Rao",
      service: "Cardiology Consultation",
      amount: 800,
      status: "paid",
      paymentMethod: "Credit Card",
      invoiceNumber: "INV-2025-001"
    },
    {
      id: "TXN002",
      date: "2025-01-08",
      hospital: "Metro Health Center",
      doctor: "Dr. Vivek Sharma",
      service: "Blood Test Package",
      amount: 1200,
      status: "paid",
      paymentMethod: "UPI",
      invoiceNumber: "INV-2025-002"
    },
    {
      id: "TXN003",
      date: "2025-01-05",
      hospital: "Heart Care Center",
      doctor: "Dr. Kiran Patel",
      service: "ECG Test",
      amount: 500,
      status: "pending",
      paymentMethod: "Pending",
      invoiceNumber: "INV-2025-003"
    },
    {
      id: "TXN004",
      date: "2024-12-28",
      hospital: "City General Hospital",
      doctor: "Dr. Arjun Mehta",
      service: "Surgery - Appendectomy",
      amount: 25000,
      status: "paid",
      paymentMethod: "Bank Transfer",
      invoiceNumber: "INV-2024-045"
    },
    {
      id: "TXN005",
      date: "2024-12-20",
      hospital: "Skin Care Clinic",
      doctor: "Dr. Neha Joshi",
      service: "Dermatology Consultation",
      amount: 600,
      status: "failed",
      paymentMethod: "Credit Card",
      invoiceNumber: "INV-2024-044"
    },
    {
      id: "TXN006",
      date: "2024-12-15",
      hospital: "Metro Health Center",
      doctor: "Dr. Rohan Gupta",
      service: "X-Ray Chest",
      amount: 300,
      status: "paid",
      paymentMethod: "Cash",
      invoiceNumber: "INV-2024-043"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "failed": return "bg-red-100 text-red-800";
      case "refunded": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="w-4 h-4" />;
      case "pending": return <Clock className="w-4 h-4" />;
      case "failed": return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesStatus = filterStatus === "all" || transaction.status === filterStatus;
    const matchesSearch = transaction.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         transaction.service.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalPaid = transactions.filter(t => t.status === "paid").reduce((sum, t) => sum + t.amount, 0);
  const totalPending = transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0);
  const totalFailed = transactions.filter(t => t.status === "failed").reduce((sum, t) => sum + t.amount, 0);

  const handleDownloadReceipt = (transaction: any) => {
    toast({
      title: "Receipt Downloaded",
      description: `Receipt for ${transaction.invoiceNumber} has been downloaded.`,
    });
  };

  const handlePayNow = (transaction: any) => {
    toast({
      title: "Payment Initiated",
      description: "Redirecting to payment gateway...",
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Payments</h1>
          <p className="text-gray-600 mt-1">Manage your medical expenses and payment history</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">₹{totalPending.toLocaleString()}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">₹{totalFailed.toLocaleString()}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">₹{(totalPaid * 0.3).toLocaleString()}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search transactions..." 
              className="pl-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="text-sm text-gray-600">
          {filteredTransactions.length} transactions found
        </div>
      </motion.div>

      {/* Transactions */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <Tabs defaultValue="list" className="w-full">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="summary">Monthly Summary</TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="space-y-4">
            {filteredTransactions.map((transaction, index) => (
              <motion.div key={transaction.id} variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Receipt className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{transaction.service}</h3>
                          <p className="text-gray-600">{transaction.doctor}</p>
                          <p className="text-sm text-gray-500">{transaction.hospital}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {transaction.date}
                            </span>
                            <span className="text-sm text-gray-500">
                              {transaction.invoiceNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right space-y-2">
                        <div className="text-2xl font-bold text-gray-900">
                          ₹{transaction.amount.toLocaleString()}
                        </div>
                        <Badge className={getStatusColor(transaction.status)}>
                          {getStatusIcon(transaction.status)}
                          <span className="ml-1 capitalize">{transaction.status}</span>
                        </Badge>
                        <div className="text-sm text-gray-500">
                          {transaction.paymentMethod}
                        </div>
                        <div className="flex space-x-2">
                          {transaction.status === "paid" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDownloadReceipt(transaction)}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Receipt
                            </Button>
                          )}
                          {transaction.status === "pending" && (
                            <Button 
                              size="sm" 
                              className="healthcare-gradient"
                              onClick={() => handlePayNow(transaction)}
                            >
                              <CreditCard className="w-3 h-3 mr-1" />
                              Pay Now
                            </Button>
                          )}
                          {transaction.status === "failed" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePayNow(transaction)}
                            >
                              Retry Payment
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </TabsContent>
          
          <TabsContent value="summary">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Spending</CardTitle>
                  <CardDescription>Your healthcare expenses by month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["January 2025", "December 2024", "November 2024"].map((month, index) => {
                      const amount = [2700, 25900, 900][index];
                      return (
                        <div key={month} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{month}</span>
                          <span className="text-lg font-bold">₹{amount.toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>Breakdown of medical expenses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { category: "Consultations", amount: 2100, percentage: 35 },
                      { category: "Tests & Diagnostics", amount: 2000, percentage: 33 },
                      { category: "Surgery", amount: 1500, percentage: 25 },
                      { category: "Medicines", amount: 400, percentage: 7 }
                    ].map((item) => (
                      <div key={item.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.category}</span>
                          <span className="text-sm text-gray-600">₹{item.amount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
