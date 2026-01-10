"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { ReceptionistProfile } from "@/lib/types";
import { getReceptionistProfileApi, updateReceptionistProfileApi } from "@/lib/api";
import { useRouter } from "next/navigation";

type FormState = {
  firstName: string;
  lastName: string;
  phone_no: string;
  gender: string;
  age: string;
};

const genderOptions = ["Female", "Male", "Other", "Prefer not to say"];

const deriveInitials = (profile: ReceptionistProfile | null) => {
  if (!profile) return "RC";
  const firstInitial = profile.firstName?.trim()?.[0] ?? profile.email?.[0] ?? "R";
  const lastInitial = profile.lastName?.trim()?.[0] ?? profile.firstName?.trim()?.[1] ?? "C";
  return `${firstInitial}${lastInitial}`.toUpperCase();
};

const createFormState = (profile: ReceptionistProfile | null): FormState => ({
  firstName: profile?.firstName ?? "",
  lastName: profile?.lastName ?? "",
  phone_no: profile?.phone_no ?? "",
  gender: profile?.gender ?? "",
  age: profile?.age != null ? String(profile.age) : "",
});

export default function ReceptionistProfilePage() {
  const { toast } = useToast();
  const router = useRouter();

  const [profile, setProfile] = useState<ReceptionistProfile | null>(null);
  const [formState, setFormState] = useState<FormState>(createFormState(null));
  const [receptionistId, setReceptionistId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!storedUser) {
      setIsLoading(false);
      setError("No receptionist profile found in session.");
      return;
    }
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.id) {
        setReceptionistId(parsed.id);
      }
    } catch (err) {
      console.error("Failed to parse stored user", err);
      setError("Unable to load your profile. Please re-authenticate.");
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!receptionistId) return;
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const response = await getReceptionistProfileApi(receptionistId);
        setProfile(response);
        setFormState(createFormState(response));
      } catch (err: any) {
        console.error("Load receptionist profile error:", err);
        setError(err?.message || "Failed to load profile.");
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, [receptionistId]);

  const initials = useMemo(() => deriveInitials(profile), [profile]);
  const displayName = useMemo(() => {
    if (!profile) return "Receptionist";
    const name = `${profile.firstName ?? ""} ${profile.lastName ?? ""}`.trim();
    return name || profile.email || "Receptionist";
  }, [profile]);

  const handleChange = (key: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!receptionistId) return;
    try {
      setIsSaving(true);
      const payload = {
        firstName: formState.firstName.trim(),
        lastName: formState.lastName.trim(),
        phone_no: formState.phone_no.trim(),
        gender: formState.gender || undefined,
        age: formState.age ? Number(formState.age) : undefined,
      };
      const updated = await updateReceptionistProfileApi(receptionistId, payload);
      setProfile(updated);
      setFormState(createFormState(updated));
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const nextUser = {
            ...parsed,
            firstName: updated.firstName,
            firstname: updated.firstName,
            lastName: updated.lastName,
            lastname: updated.lastName,
            phone_no: updated.phone_no,
            phoneNo: updated.phone_no,
            gender: updated.gender,
            age: updated.age,
          };
          localStorage.setItem("user", JSON.stringify(nextUser));
        } catch (err) {
          console.warn("Unable to update cached user", err);
        }
      }
      toast({
        title: "Profile updated",
        description: "Your receptionist details have been saved successfully.",
      });
    } catch (err: any) {
      console.error("Save receptionist profile error:", err);
      toast({
        title: "Failed to save profile",
        description: err?.message || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("user");
      window.localStorage.removeItem("session");
    }
    router.push("/auth");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Unable to load profile</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Try refreshing the page or signing in again. If the issue persists, contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">My Profile</h1>
          <p className="text-slate-500">Manage your receptionist information and contact details.</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto">
          Log out
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl">Personal information</CardTitle>
            <CardDescription>
              Keep your name and contact information up to date for doctors and patients.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-16 w-16 border-4 border-white shadow-md">
              <AvatarFallback className="bg-purple-100 text-lg font-semibold text-purple-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-semibold text-slate-900">{displayName}</p>
              <p className="text-sm text-slate-500">{profile?.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={formState.firstName}
                onChange={(event) => handleChange("firstName", event.target.value)}
                placeholder="Priya"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={formState.lastName}
                onChange={(event) => handleChange("lastName", event.target.value)}
                placeholder="Sharma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={formState.phone_no}
                onChange={(event) => handleChange("phone_no", event.target.value)}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formState.gender}
                onValueChange={(value) => handleChange("gender", value)}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={18}
                value={formState.age}
                onChange={(event) => handleChange("age", event.target.value)}
                placeholder="32"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hospital">Assigned hospital</Label>
              <Input
                id="hospital"
                value={profile?.hospitalName ?? "Not assigned"}
                readOnly
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
