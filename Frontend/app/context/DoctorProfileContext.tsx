"use client";

import { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface DoctorProfileState {
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
  phone: string;
  bio: string;
  profilePic: string;
}

interface DoctorProfileContextType {
  profileData: DoctorProfileState;
  updateProfile: (field: keyof DoctorProfileState, value: string) => void;
  isDirty: boolean;
  saveProfile: () => void;
  setProfileData: (data: DoctorProfileState) => void;
}

const DoctorProfileContext = createContext<DoctorProfileContextType | undefined>(undefined);

const initialProfileData: DoctorProfileState = {
  firstName: "Sarah",
  lastName: "Wilson",
  specialty: "Cardiologist",
  email: "sarah.wilson@swasthyasetu.com",
  phone: "+91 98765 43210",
  bio: "Dr. Sarah Wilson is a renowned cardiologist with over 15 years of experience in treating cardiovascular diseases. She is dedicated to providing the best care for her patients.",
  profilePic: "https://placehold.co/200x200/E2E8F0/4A5568?text=SW",
};

export const DoctorProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profileData, setProfileData] = useState<DoctorProfileState>(initialProfileData);
  const [originalProfileData, setOriginalProfileData] = useState<DoctorProfileState>(initialProfileData);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsDirty(JSON.stringify(profileData) !== JSON.stringify(originalProfileData));
  }, [profileData, originalProfileData]);

  const updateProfile = (field: keyof DoctorProfileState, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const saveProfile = () => {
    setOriginalProfileData(profileData);
    setIsDirty(false);
    toast({
      title: "Profile Saved!",
      description: "Your information has been successfully updated.",
    });
  };

  return (
    <DoctorProfileContext.Provider value={{ profileData, updateProfile, isDirty, saveProfile, setProfileData }}>
      {children}
    </DoctorProfileContext.Provider>
  );
};

export const useDoctorProfile = () => {
  const context = useContext(DoctorProfileContext);
  if (!context) {
    throw new Error("useDoctorProfile must be used within a DoctorProfileProvider");
  }
  return context;
};
