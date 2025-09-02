"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Calendar,
  FileText,
  Phone,
  Mail,
  User,
  Baby,
  Heart,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function FamilyMembersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const { toast } = useToast();

  const familyMembers = [
    {
      id: 1,
      name: "Sarah Johnson",
      relation: "Spouse",
      age: 32,
      gender: "Female",
      bloodGroup: "A+",
      phone: "+91 98765 43210",
      email: "sarah.johnson@email.com",
      medicalHistory: ["Diabetes", "Hypertension"],
      allergies: ["Penicillin"],
      emergencyContact: true,
      lastCheckup: "2024-12-15",
      upcomingAppointments: 2,
      avatar: "SJ"
    },
    {
      id: 2,
      name: "Emma Johnson",
      relation: "Daughter",
      age: 8,
      gender: "Female",
      bloodGroup: "O+",
      phone: "+91 98765 43210",
      email: "",
      medicalHistory: ["Asthma"],
      allergies: ["Dust", "Pollen"],
      emergencyContact: false,
      lastCheckup: "2024-11-20",
      upcomingAppointments: 1,
      avatar: "EJ"
    },
    {
      id: 3,
      name: "Robert Johnson Sr.",
      relation: "Father",
      age: 65,
      gender: "Male",
      bloodGroup: "B+",
      phone: "+91 98765 43211",
      email: "robert.sr@email.com",
      medicalHistory: ["Heart Disease", "Arthritis"],
      allergies: ["Shellfish"],
      emergencyContact: true,
      lastCheckup: "2024-12-01",
      upcomingAppointments: 3,
      avatar: "RJ"
    },
    {
      id: 4,
      name: "Mary Johnson",
      relation: "Mother",
      age: 62,
      gender: "Female",
      bloodGroup: "AB-",
      phone: "+91 98765 43212",
      email: "mary.johnson@email.com",
      medicalHistory: ["Osteoporosis"],
      allergies: [],
      emergencyContact: true,
      lastCheckup: "2024-11-28",
      upcomingAppointments: 1,
      avatar: "MJ"
    }
  ];

  const relations = [
    "Spouse", "Father", "Mother", "Son", "Daughter", 
    "Brother", "Sister", "Grandfather", "Grandmother", "Other"
  ];

  const getRelationIcon = (relation: string) => {
    switch (relation.toLowerCase()) {
      case "spouse": return <Heart className="w-4 h-4" />;
      case "son":
      case "daughter": return <Baby className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getRelationColor = (relation: string) => {
    switch (relation.toLowerCase()) {
      case "spouse": return "bg-pink-100 text-pink-800";
      case "father":
      case "mother": return "bg-blue-100 text-blue-800";
      case "son":
      case "daughter": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleAddMember = () => {
    toast({
      title: "Family Member Added!",
      description: "New family member has been successfully added.",
    });
    setShowAddModal(false);
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
          <h1 className="text-3xl font-bold text-gray-900">Family Members</h1>
          <p className="text-gray-600 mt-1">Manage your family's health records and appointments</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="healthcare-gradient">
              <Plus className="w-4 h-4 mr-2" />
              Add Family Member
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Family Member</DialogTitle>
              <DialogDescription>
                Add a new family member to manage their health records
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter full name" />
                </div>
                <div>
                  <Label htmlFor="relation">Relation</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      {relations.map((relation) => (
                        <SelectItem key={relation} value={relation.toLowerCase()}>
                          {relation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" type="number" placeholder="Age" />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="bloodGroup">Blood Group</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Blood group" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a+">A+</SelectItem>
                      <SelectItem value="a-">A-</SelectItem>
                      <SelectItem value="b+">B+</SelectItem>
                      <SelectItem value="b-">B-</SelectItem>
                      <SelectItem value="ab+">AB+</SelectItem>
                      <SelectItem value="ab-">AB-</SelectItem>
                      <SelectItem value="o+">O+</SelectItem>
                      <SelectItem value="o-">O-</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+91 98765 43210" />
                </div>
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input id="email" type="email" placeholder="email@example.com" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea 
                  id="medicalHistory" 
                  placeholder="List any known medical conditions, surgeries, or ongoing treatments"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Input id="allergies" placeholder="List any known allergies (comma separated)" />
              </div>
              
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="emergencyContact" className="rounded" />
                <Label htmlFor="emergencyContact">Set as emergency contact</Label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMember} className="healthcare-gradient">
                  Add Member
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
                <p className="text-sm text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{familyMembers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emergency Contacts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {familyMembers.filter(m => m.emergencyContact).length}
                </p>
              </div>
              <Phone className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Upcoming Appointments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {familyMembers.reduce((sum, m) => sum + m.upcomingAppointments, 0)}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Conditions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {familyMembers.reduce((sum, m) => sum + m.medicalHistory.length, 0)}
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Family Members Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {familyMembers.map((member, index) => (
          <motion.div key={member.id} variants={itemVariants}>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {member.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge className={getRelationColor(member.relation)}>
                          {getRelationIcon(member.relation)}
                          <span className="ml-1">{member.relation}</span>
                        </Badge>
                        {member.emergencyContact && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            Emergency
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button size="sm" variant="outline">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Age:</span>
                    <span className="ml-2 font-medium">{member.age} years</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Blood:</span>
                    <span className="ml-2 font-medium">{member.bloodGroup}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Gender:</span>
                    <span className="ml-2 font-medium">{member.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Checkup:</span>
                    <span className="ml-2 font-medium">{member.lastCheckup}</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-600 mb-2">Contact:</div>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Phone className="w-3 h-3 mr-2 text-gray-400" />
                      {member.phone}
                    </div>
                    {member.email && (
                      <div className="flex items-center text-sm">
                        <Mail className="w-3 h-3 mr-2 text-gray-400" />
                        {member.email}
                      </div>
                    )}
                  </div>
                </div>
                
                {member.medicalHistory.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Medical History:</div>
                    <div className="flex flex-wrap gap-1">
                      {member.medicalHistory.map((condition, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {member.allergies.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Allergies:</div>
                    <div className="flex flex-wrap gap-1">
                      {member.allergies.map((allergy, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs text-red-600 border-red-200">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Calendar className="w-3 h-3 mr-1" />
                    Appointments ({member.upcomingAppointments})
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <FileText className="w-3 h-3 mr-1" />
                    Records
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}