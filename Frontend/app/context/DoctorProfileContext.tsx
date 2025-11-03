"use client";

import { createContext, useState, useContext, ReactNode, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRoute } from "@/config/env";

interface DoctorProfileState {
  id: string | null;
  firstName: string;
  lastName: string;
  specialty: string;
  email: string;
  phone: string;
  bio: string;
  profilePic: string;
  hospitalId: string | null;
  hospitalName: string | null;
  gender?: string | null;
  age?: number | null;
}

interface DoctorProfileContextType {
  profileData: DoctorProfileState;
  updateProfile: (field: keyof DoctorProfileState, value: string) => void;
  isDirty: boolean;
  saveProfile: () => Promise<void>;
  setProfileData: (data: DoctorProfileState) => void;
}

const DoctorProfileContext = createContext<DoctorProfileContextType | undefined>(undefined);

const initialProfileData: DoctorProfileState = {
  id: null,
  firstName: "",
  lastName: "",
  specialty: "",
  email: "",
  phone: "",
  bio: "",
  profilePic: "",
  hospitalId: null,
  hospitalName: null,
  gender: null,
  age: null,
};

export const DoctorProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profileData, setProfileDataState] = useState<DoctorProfileState>(initialProfileData);
  const [originalProfileData, setOriginalProfileData] = useState<DoctorProfileState>(initialProfileData);
  const [isDirty, setIsDirty] = useState(false);
  const { toast } = useToast();

  const fetchProfile = useCallback(async (doctorId: string) => {
    try {
      const response = await fetch(apiRoute(`/api/doctor/profile/${doctorId}`), {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Failed to load doctor profile");
      }
      const payload = await response.json();
      const mergedProfile: DoctorProfileState = {
        ...initialProfileData,
        ...payload,
        id: doctorId,
        profilePic: initialProfileData.profilePic,
      };
      setProfileDataState(mergedProfile);
      setOriginalProfileData(mergedProfile);
    } catch (error) {
      console.error("Unable to fetch doctor profile:", error);
      toast({
        title: "Profile Unavailable",
        description: "We could not load your latest profile details. Showing cached data instead.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const baseProfile: DoctorProfileState = {
          ...initialProfileData,
          id: userData.id || null,
          firstName: userData.firstName || initialProfileData.firstName,
          lastName: userData.lastName || initialProfileData.lastName,
          email: userData.email || initialProfileData.email,
          phone: userData.phone_no || initialProfileData.phone,
          specialty: userData.spec || userData.specialty || initialProfileData.specialty,
          hospitalId: userData.hospitalId || userData.hospital_id || initialProfileData.hospitalId,
          hospitalName: userData.hospitalName || userData.hospital_name || initialProfileData.hospitalName,
        };
        setProfileDataState(baseProfile);
        setOriginalProfileData(baseProfile);

        if (userData.id) {
          fetchProfile(userData.id);
        }
      } catch (err) {
        console.error("Failed to parse user data from localStorage:", err);
      }
    }
  }, [fetchProfile]);

  useEffect(() => {
    setIsDirty(JSON.stringify(profileData) !== JSON.stringify(originalProfileData));
  }, [profileData, originalProfileData]);

  const updateProfile = (field: keyof DoctorProfileState, value: string) => {
    setProfileDataState((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    if (!profileData.id) {
      toast({
        title: "Unable to save",
        description: "Missing doctor identifier. Try signing in again.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      email: profileData.email,
      specialty: profileData.specialty,
      phone: profileData.phone,
      bio: profileData.bio,
    };

    try {
      const response = await fetch(apiRoute(`/api/doctor/profile/${profileData.id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Failed to save profile");
      }

      const updated = await response.json();
      const merged: DoctorProfileState = {
        ...profileData,
        ...updated,
        id: profileData.id,
        profilePic: profileData.profilePic,
      };

      setProfileDataState(merged);
      setOriginalProfileData(merged);
      setIsDirty(false);

      toast({
        title: "Profile Updated",
        description: "Your information has been saved successfully.",
      });
    } catch (error: any) {
      console.error("Save profile error:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Unable to save profile changes.",
        variant: "destructive",
      });
    }
  };

  const setProfileData = (data: DoctorProfileState) => {
    setProfileDataState(data);
    setOriginalProfileData(data);
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
