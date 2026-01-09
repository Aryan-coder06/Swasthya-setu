"use client";

import { useEffect, useMemo, useState } from "react";
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
import type { FamilyMember } from "@/lib/types";
import {
  createFamilyMemberApi,
  deleteFamilyMemberApi,
  getFamilyMembers,
  updateFamilyMemberApi,
} from "@/lib/api";

export default function FamilyMembersPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    relation: "",
    age: "",
    gender: "",
    bloodGroup: "",
    phone: "",
    email: "",
    medicalHistory: "",
    allergies: "",
    emergencyContact: false,
    lastCheckup: "",
    notes: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("user");
      if (!stored) return;
      const parsed = JSON.parse(stored);
      const id = parsed?.id || parsed?.uid || parsed?.user_id;
      if (id) {
        setPatientId(id);
      }
    } catch (error) {
      console.error("Failed to parse stored user", error);
    }
  }, []);

  useEffect(() => {
    if (!patientId) return;
    const loadFamily = async () => {
      try {
        setIsLoading(true);
        const data = await getFamilyMembers(patientId);
        setFamilyMembers(data);
      } catch (error: any) {
        console.error("Failed to load family members", error);
        toast({
          title: "Unable to load family members",
          description: error?.message || "Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadFamily();
  }, [patientId, toast]);

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

  const resetForm = () => {
    setFormData({
      fullName: "",
      relation: "",
      age: "",
      gender: "",
      bloodGroup: "",
      phone: "",
      email: "",
      medicalHistory: "",
      allergies: "",
      emergencyContact: false,
      lastCheckup: "",
      notes: "",
    });
  };

  const openAddModal = () => {
    setSelectedMember(null);
    resetForm();
    setShowAddModal(true);
  };

  const openEditModal = (member: FamilyMember) => {
    setSelectedMember(member);
    setFormData({
      fullName: member.full_name ?? "",
      relation: member.relation ?? "",
      age: member.age?.toString() ?? "",
      gender: member.gender ?? "",
      bloodGroup: member.blood_group ?? "",
      phone: member.phone ?? "",
      email: member.email ?? "",
      medicalHistory: (member.medical_history ?? []).join(", "),
      allergies: (member.allergies ?? []).join(", "),
      emergencyContact: !!member.emergency_contact,
      lastCheckup: member.last_checkup ?? "",
      notes: member.notes ?? "",
    });
    setShowAddModal(true);
  };

  const handleSaveMember = async () => {
    if (!patientId) {
      toast({
        title: "Sign in required",
        description: "Login as a patient to manage family members.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.fullName.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter the family member's full name.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (selectedMember) {
        const updated = await updateFamilyMemberApi(selectedMember.id, {
          fullName: formData.fullName,
          relation: formData.relation || null,
          age: formData.age ? Number(formData.age) : null,
          gender: formData.gender || null,
          bloodGroup: formData.bloodGroup || null,
          phone: formData.phone || null,
          email: formData.email || null,
          medicalHistory: formData.medicalHistory || null,
          allergies: formData.allergies || null,
          emergencyContact: formData.emergencyContact,
          lastCheckup: formData.lastCheckup || null,
          notes: formData.notes || null,
        });
        setFamilyMembers((prev) =>
          prev.map((member) => (member.id === updated.id ? updated : member))
        );
        toast({
          title: "Family member updated",
          description: "Changes saved successfully.",
        });
      } else {
        const created = await createFamilyMemberApi({
          patientId,
          fullName: formData.fullName,
          relation: formData.relation || null,
          age: formData.age ? Number(formData.age) : null,
          gender: formData.gender || null,
          bloodGroup: formData.bloodGroup || null,
          phone: formData.phone || null,
          email: formData.email || null,
          medicalHistory: formData.medicalHistory || null,
          allergies: formData.allergies || null,
          emergencyContact: formData.emergencyContact,
          lastCheckup: formData.lastCheckup || null,
          notes: formData.notes || null,
        });
        setFamilyMembers((prev) => [created, ...prev]);
        toast({
          title: "Family member added",
          description: "New profile saved successfully.",
        });
      }
      setShowAddModal(false);
    } catch (error: any) {
      console.error("Save family member failed", error);
      toast({
        title: "Action failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMember = async (member: FamilyMember) => {
    const confirmed = window.confirm(`Remove ${member.full_name} from your family list?`);
    if (!confirmed) return;
    try {
      await deleteFamilyMemberApi(member.id);
      setFamilyMembers((prev) => prev.filter((item) => item.id !== member.id));
      toast({
        title: "Family member removed",
        description: "The profile has been deleted.",
      });
    } catch (error: any) {
      console.error("Delete family member failed", error);
      toast({
        title: "Delete failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const stats = useMemo(() => {
    const emergencyCount = familyMembers.filter((m) => m.emergency_contact).length;
    const conditions = familyMembers.reduce(
      (sum, m) => sum + (m.medical_history?.length ?? 0),
      0
    );
    return {
      total: familyMembers.length,
      emergency: emergencyCount,
      upcomingAppointments: 0,
      conditions,
    };
  }, [familyMembers]);

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
          <p className="text-gray-600 mt-1">Manage your family&apos;s health records and appointments</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="healthcare-gradient" onClick={openAddModal}>
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
                  <Input
                    id="name"
                    placeholder="Enter full name"
                    value={formData.fullName}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, fullName: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="relation">Relation</Label>
                  <Select
                    value={formData.relation || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, relation: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent>
                      {relations.map((relation) => (
                        <SelectItem key={relation} value={relation}>
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
                  <Input
                    id="age"
                    type="number"
                    placeholder="Age"
                    value={formData.age}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, age: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, gender: value }))
                    }
                  >
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
                  <Select
                    value={formData.bloodGroup || undefined}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, bloodGroup: value }))
                    }
                  >
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
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, phone: event.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    value={formData.email}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, email: event.target.value }))
                    }
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea 
                  id="medicalHistory" 
                  placeholder="List any known medical conditions, surgeries, or ongoing treatments"
                  rows={3}
                  value={formData.medicalHistory}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, medicalHistory: event.target.value }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="allergies">Allergies</Label>
                <Input
                  id="allergies"
                  placeholder="List any known allergies (comma separated)"
                  value={formData.allergies}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, allergies: event.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="lastCheckup">Last Checkup</Label>
                <Input
                  id="lastCheckup"
                  type="date"
                  value={formData.lastCheckup}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, lastCheckup: event.target.value }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any care notes or reminders"
                  rows={2}
                  value={formData.notes}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="emergencyContact"
                  className="rounded"
                  checked={formData.emergencyContact}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, emergencyContact: event.target.checked }))
                  }
                />
                <Label htmlFor="emergencyContact">Set as emergency contact</Label>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveMember} className="healthcare-gradient">
                  {selectedMember ? "Update Member" : "Add Member"}
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
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                  {stats.emergency}
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
                  {stats.upcomingAppointments}
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
                  {stats.conditions}
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
        {isLoading && (
          <motion.div variants={itemVariants} className="col-span-full">
            <Card className="border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-muted-foreground">
              Loading family members...
            </Card>
          </motion.div>
        )}
        {!isLoading && !familyMembers.length && (
          <motion.div variants={itemVariants} className="col-span-full">
            <Card className="border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-muted-foreground">
              No family members yet. Add your first profile to get started.
            </Card>
          </motion.div>
        )}
        {familyMembers.map((member) => {
          const initials = member.full_name
            .split(" ")
            .map((part) => part[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          const medicalHistory = member.medical_history ?? [];
          const allergies = member.allergies ?? [];
          return (
            <motion.div key={member.id} variants={itemVariants}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {initials || "FM"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{member.full_name}</CardTitle>
                        <div className="flex flex-wrap items-center gap-2">
                          {member.relation && (
                            <Badge className={getRelationColor(member.relation)}>
                              {getRelationIcon(member.relation)}
                              <span className="ml-1">{member.relation}</span>
                            </Badge>
                          )}
                          {member.emergency_contact && (
                            <Badge variant="outline" className="text-red-600 border-red-200">
                              Emergency
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(member)}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600"
                        onClick={() => handleDeleteMember(member)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Age:</span>
                      <span className="ml-2 font-medium">{member.age ?? "—"} years</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Blood:</span>
                      <span className="ml-2 font-medium">{member.blood_group ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Gender:</span>
                      <span className="ml-2 font-medium">{member.gender ?? "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Checkup:</span>
                      <span className="ml-2 font-medium">{member.last_checkup ?? "—"}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Contact:</div>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Phone className="w-3 h-3 mr-2 text-gray-400" />
                        {member.phone || "Not shared"}
                      </div>
                      {member.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="w-3 h-3 mr-2 text-gray-400" />
                          {member.email}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {medicalHistory.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Medical History:</div>
                      <div className="flex flex-wrap gap-1">
                        {medicalHistory.map((condition, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {condition}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {allergies.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Allergies:</div>
                      <div className="flex flex-wrap gap-1">
                        {allergies.map((allergy, idx) => (
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
                      Appointments
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="w-3 h-3 mr-1" />
                      Records
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
