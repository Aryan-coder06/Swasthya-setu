"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from "@/hooks/use-toast"; // Corrected import path

// Define the shape of the profile data
interface ProfileData {
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

// Define the shape of the context's value
interface ProfileContextType {
  profileData: ProfileData;
  updateProfileData: (updates: Partial<ProfileData>) => void;
  saveProfile: () => void;
  isDirty: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

// Set the initial state for the profile
const initialProfileData: ProfileData = {
  firstName: "John",
  lastName: "Doe",
  email: "john.doe@example.com",
  phone: "+91 98765 43210",
  dob: "1990-05-15",
  address: "123 Health St.",
  city: "Wellness City",
  state: "State of Calm",
  pincode: "123456",
  profilePic: "",
};

// Create the provider component that will wrap parts of your app
export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  // Function to update profile data and mark changes as dirty
  const updateProfileData = (updates: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }));
    if (!isDirty) {
      setIsDirty(true);
    }
  };

  // Function to save changes
  const saveProfile = () => {
    // In a real application, you would make an API call here.
    console.log("Saving profile data:", profileData);
    
    setIsDirty(false);
    toast({
      title: "Profile Saved!",
      description: "Your information has been successfully updated.",
    });
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

