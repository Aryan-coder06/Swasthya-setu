"use client";

import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile } from "@/app/context/ProfileContext"; // Import the custom hook
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  // Get state and functions from the global context
  const { profileData, updateProfileData, saveProfile } = useProfile();
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    // Update the global state, which will trigger the "isDirty" flag
    updateProfileData({ [id]: value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        // Update the profile picture in the global state
        updateProfileData({ profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("session");
    }
    router.push("/auth");
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">View and manage your personal information.</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
            Log out
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-blue-200">
                <AvatarImage src={profileData.profilePic} alt="Profile Picture" />
                <AvatarFallback className="text-3xl bg-blue-50 text-blue-600">
                  {profileData.firstName[0]}{profileData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <Label htmlFor="profile-pic-upload" className="absolute bottom-0 right-0 bg-white rounded-full p-2 cursor-pointer shadow-md hover:bg-gray-100">
                  <Camera className="w-4 h-4 text-gray-600" />
                  <Input id="profile-pic-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </Label>
            </div>
            <div>
                <h3 className="text-xl font-bold">{profileData.firstName} {profileData.lastName}</h3>
                <p className="text-gray-500">{profileData.email}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} initial="hidden" animate="visible">
        {/* The form's save button now calls the global saveProfile function */}
        <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label htmlFor="firstName">First Name</Label><Input id="firstName" value={profileData.firstName} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="lastName">Last Name</Label><Input id="lastName" value={profileData.lastName} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="email">Email Address</Label><Input id="email" type="email" value={profileData.email} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="phone">Phone Number</Label><Input id="phone" type="tel" value={profileData.phone} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="dob">Date of Birth</Label><Input id="dob" type="date" value={profileData.dob} onChange={handleInputChange} /></div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
              <CardDescription>Update your residential address.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" value={profileData.address} onChange={handleInputChange} /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" value={profileData.city} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="state">State</Label><Input id="state" value={profileData.state} onChange={handleInputChange} /></div>
                <div className="space-y-2"><Label htmlFor="pincode">Pincode</Label><Input id="pincode" value={profileData.pincode} onChange={handleInputChange} /></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-6">
            <Button type="submit" className="healthcare-gradient">
              Save Changes
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
