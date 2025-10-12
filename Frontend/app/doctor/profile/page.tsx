"use client";

import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDoctorProfile } from "../../context/DoctorProfileContext";

export default function DoctorProfilePage() {
  const { profileData, updateProfile } = useDoctorProfile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfile("profilePic", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      className="space-y-6"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold text-gray-900">Doctor Profile</motion.h1>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal and professional details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="w-24 h-24 border-4 border-white shadow-md">
                  <AvatarImage src={profileData.profilePic} />
                  <AvatarFallback className="text-3xl bg-green-100 text-green-700">
                    {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <Label htmlFor="profile-pic-upload" className="absolute bottom-0 right-0 bg-white rounded-full p-2 cursor-pointer shadow-md hover:bg-gray-100">
                  <Camera className="w-5 h-5 text-gray-600" />
                  <Input id="profile-pic-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </Label>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Dr. {profileData.firstName} {profileData.lastName}</h2>
                <p className="text-gray-600">{profileData.specialty}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" value={profileData.firstName} onChange={(e) => updateProfile('firstName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" value={profileData.lastName} onChange={(e) => updateProfile('lastName', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input id="specialty" value={profileData.specialty} onChange={(e) => updateProfile('specialty', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" value={profileData.email} onChange={(e) => updateProfile('email', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" value={profileData.phone} onChange={(e) => updateProfile('phone', e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio</Label>
              <Textarea id="bio" value={profileData.bio} onChange={(e) => updateProfile('bio', e.target.value)} rows={5} placeholder="Tell us about your professional background..." />
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}


