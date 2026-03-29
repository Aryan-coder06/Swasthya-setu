"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { apiRoute } from "@/config/env"; // Adjust this if your env config is located elsewhere

// Define the shape of the profile data
export interface ProfileData {
  id: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  profilePic: string; // Can be a URL or a base64 string
}

interface ProfileContextType {
  profileData: ProfileData;
  updateProfileData: (updates: Partial<ProfileData>) => void;
  saveProfile: () => Promise<void>; // Updated to return a Promise
  isDirty: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const initialProfileData: ProfileData = {
  id: null,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  profilePic: "",
};

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load initial data from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setProfileData(prev => ({
          ...prev,
          id: userData.id || prev.id,
          firstName: userData.firstName || prev.firstName,
          lastName: userData.lastName || prev.lastName,
          email: userData.email || prev.email,
          phone: userData.phone_no || userData.phone || prev.phone,
          dob: userData.dob || prev.dob,
          address: userData.address || prev.address,
          city: userData.city || prev.city,
          state: userData.state || prev.state,
          pincode: userData.pincode || prev.pincode,
          profilePic: userData.profilePic || prev.profilePic,
        }));
      } catch (err) {
        console.error('Failed to parse user data from localStorage:', err);
      }
    }
  }, []);

  // Function to update local React state and mark changes as dirty
  const updateProfileData = (updates: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }));
    if (!isDirty) {
      setIsDirty(true);
    }
  };

  // Function to push changes to the backend
  const saveProfile = async () => {
    if (!profileData.id) {
      toast({
        title: "Authentication Error",
        description: "User ID not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Map the frontend state to match your database columns
      const payload = {
        userId: profileData.id,
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        email: profileData.email,
        phone_no: profileData.phone, // Assuming your DB uses phone_no based on the useEffect
        dob: profileData.dob,
        address: profileData.address,
        city: profileData.city,
        state: profileData.state,
        pincode: profileData.pincode,
        profilePic: profileData.profilePic
      };

      // 1. Make the API call to update Supabase via your Node backend
      // --> This is the line that was fixed! <--
      await axios.put(apiRoute("/profile/docs/update"), payload);

      // 2. Update localStorage so changes persist on page refresh
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        const updatedUserData = { ...userData, ...payload };
        localStorage.setItem('user', JSON.stringify(updatedUserData));
      }

      // 3. Reset dirty state and show success
      setIsDirty(false);
      toast({
        title: "Profile Saved!",
        description: "Your information has been successfully updated in the database.",
      });

    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const value = { profileData, updateProfileData, saveProfile, isDirty };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

// Custom hook for easy access to the context
export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};