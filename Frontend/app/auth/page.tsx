"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Heart, User, Stethoscope, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import { API_BASE_URL, apiRoute } from "@/config/env";
import { useToast } from "@/hooks/use-toast";

const API_URL = API_BASE_URL;

const normaliseUserProfile = (user: any, role: string | null = null) => {
  if (!user || typeof user !== "object") return user;
  const next = { ...user };
  if (next.firstname && !next.firstName) next.firstName = next.firstname;
  if (next.lastname && !next.lastName) next.lastName = next.lastname;
  if (next.phoneNo && !next.phone_no) next.phone_no = next.phoneNo;
  if (next.phone_no && !next.phoneNo) next.phoneNo = next.phone_no;
  if (next.hospital_id && !next.hospitalId) next.hospitalId = next.hospital_id;
  if (next.hospitalId && !next.hospital_id) next.hospital_id = next.hospitalId;
  if (next.hospital_name && !next.hospitalName) next.hospitalName = next.hospital_name;
  if (role && !next.role) next.role = role;
  return next;
};

type HospitalOption = {
  id: string;
  name: string;
  city?: string | null;
  state?: string | null;
  address?: string | null;
};

export default function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone_no: "",
    email: "",
    password: "",
    gender: "",
    age: "",
    specialization: "",
    hospitalId: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [hospitalOptions, setHospitalOptions] = useState<HospitalOption[]>([]);
  const [hospitalLoading, setHospitalLoading] = useState(false);
  const router = useRouter();

  const roles = [
    {
      id: "patient",
      title: "Patient",
      description: "Book appointments, manage records, access consultations",
      icon: User,
      color: "bg-blue-500",
      route: "/patient",
    },
    {
      id: "doctor",
      title: "Doctor",
      description: "Manage appointments, patient records, consultations",
      icon: Stethoscope,
      color: "bg-green-500",
      route: "/doctor",
    },
    {
      id: "receptionist",
      title: "Receptionist",
      description: "Handle appointments, billing, hospital management",
      icon: Users,
      color: "bg-purple-500",
      route: "/receptionist",
    },
  ];

  const requiresHospital = useMemo(
    () => selectedRole === "doctor" || selectedRole === "receptionist",
    [selectedRole]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleGenderChange = (value: string) => {
    setFormData({ ...formData, gender: value });
  };

  useEffect(() => {
    if (!requiresHospital) {
      setFormData((prev) => ({ ...prev, hospitalId: "" }));
      return;
    }

    const fetchHospitals = async () => {
      setHospitalLoading(true);
      try {
        const response = await axios.get(apiRoute("/auth/hospitals"), { params: { limit: 200 } });
        const options: HospitalOption[] = Array.isArray(response.data?.data)
          ? response.data.data
          : [];
        setHospitalOptions(options);
      } catch (error) {
        console.error("Failed to load hospitals:", error);
        setHospitalOptions([]);
      } finally {
        setHospitalLoading(false);
      }
    };

    if (hospitalOptions.length === 0) {
      fetchHospitals();
    }
  }, [requiresHospital, hospitalOptions.length]);

  useEffect(() => {
    if (!requiresHospital) return;
    if (formData.hospitalId) return;

    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        const storedHospital = userData?.hospitalId || userData?.hospital_id || "";
        if (storedHospital) {
          setFormData((prev) => ({ ...prev, hospitalId: storedHospital }));
        }
      } catch (error) {
        console.error("Failed to parse stored user for hospital:", error);
      }
    }
  }, [requiresHospital, formData.hospitalId]);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);
    setForgotPasswordMessage(null);
    try {
      const response = await axios.post(apiRoute("/auth/forgot-password"), {
        email: forgotPasswordEmail,
      });
      setForgotPasswordMessage({ type: "success", text: "Password reset email sent successfully. Please check your inbox." });
      toast({
        title: "Password reset sent",
        description: "Check your inbox for the reset link.",
      });
      setTimeout(() => {
        setForgotPasswordOpen(false);
        setForgotPasswordEmail("");
        setForgotPasswordMessage(null);
      }, 2000);
    } catch (error: any) {
      console.error('Forgot password error:', error);
      const messageText = error.response?.data?.error || error.message || "Failed to send password reset email. Please try again.";
      toast({
        title: "Reset request failed",
        description: messageText,
        variant: "destructive",
      });
      setForgotPasswordMessage({
        type: "error",
        text: messageText
      });
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      if ((selectedRole === "doctor" || selectedRole === "receptionist") && !formData.hospitalId) {
        toast({
          title: "Hospital required",
          description: "Select the hospital you are associated with.",
          variant: "destructive",
        });
        setMessage({ type: "error", text: "Select the hospital you are associated with." });
        setIsLoading(false);
        return;
      }

      const payload: Record<string, any> = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone_no: formData.phone_no,
        gender: formData.gender,
        age: formData.age,
      };

      if (selectedRole === "doctor") {
        payload.spec = formData.specialization;
      }
      if (selectedRole !== "patient") {
        payload.hospitalId = formData.hospitalId;
      }

      const response = await axios.post(apiRoute(`/auth/signup/${selectedRole}`), payload, {
        timeout: 30000,
      });

      const errorMsg = response.data.error || response.data.reason;
      if (errorMsg && errorMsg !== "None" && errorMsg !== null) {
        toast({
          title: "Registration failed",
          description: errorMsg,
          variant: "destructive",
        });
        setMessage({
          type: "error",
          text: errorMsg || "Registration failed. Please try again.",
        });
        return;
      }

      if (response.data.user && response.data.session) {
        toast({
          title: "Registration successful",
          description: `Welcome to SwasthyaSetu, ${formData.firstName || "there"}!`,
        });
        setMessage({ type: "success", text: response.data.message || "Registration successful!" });
        const normalisedUser = normaliseUserProfile(response.data.user, selectedRole);
        localStorage.setItem("user", JSON.stringify(normalisedUser));
        localStorage.setItem("session", JSON.stringify(response.data.session));
        setTimeout(() => {
          router.push(roles.find((r) => r.id === selectedRole)!.route);
        }, 2000);
      } else if (response.data.user && !response.data.session) {
        toast({
          title: "Verify your email",
          description: "We sent a confirmation link to your inbox. Please verify to continue.",
        });
        setMessage({
          type: "success",
          text: "Check your email and confirm your account before signing in.",
        });
      } else {
        toast({
          title: "Registration failed",
          description: "Invalid response from server.",
          variant: "destructive",
        });
        setMessage({ type: "error", text: "Registration failed. Invalid response from server." });
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorText = error.response?.data?.reason || error.response?.data?.error || error.message;
      toast({
        title: "Registration failed",
        description:
          error.response?.status === 404
            ? "Backend server not found. Ensure the server is running on the configured API URL."
            : (errorText && errorText !== "None" ? errorText : "Please try again."),
        variant: "destructive",
      });
      setMessage({
        type: "error",
        text:
          error.response?.status === 404
            ? "Backend server not found. Ensure the server is running on the configured API URL."
            : (errorText && errorText !== "None" ? errorText : "Registration failed. Please try again."),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === "register") {
      handleRegister(e);
      return;
    }

    if (!selectedRole) {
      toast({
        title: "Role required",
        description: "Please select a role before continuing.",
        variant: "destructive",
      });
      setMessage({ type: "error", text: "Please select a role." });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      if ((selectedRole === "doctor" || selectedRole === "receptionist") && !formData.hospitalId) {
        toast({
          title: "Hospital required",
          description: "Select your hospital before signing in.",
          variant: "destructive",
        });
        setMessage({ type: "error", text: "Select your hospital before signing in." });
        setIsLoading(false);
        return;
      }

      const payload: Record<string, any> = {
        email: formData.email,
        password: formData.password,
      };

      if (selectedRole !== "patient") {
        payload.hospitalId = formData.hospitalId;
      }

      const response = await axios.post(apiRoute(`/auth/signin/${selectedRole}`), payload, {
        timeout: 30000,
      });
      setMessage({ type: "success", text: response.data.message });
      toast({
        title: "Welcome back",
        description: response.data.message || "You are signed in.",
      });
      const normalisedUser = normaliseUserProfile(response.data.user, selectedRole);
      localStorage.setItem("user", JSON.stringify(normalisedUser));
      if (response.data.session) {
        localStorage.setItem("session", JSON.stringify(response.data.session));
      } else {
        localStorage.removeItem("session");
      }
      setTimeout(() => {
        router.push(roles.find((r) => r.id === selectedRole)!.route);
      }, 2000);
    } catch (error: any) {
      console.error("Signin error:", error);
      const messageText =
        error.response?.status === 404
          ? "Backend server not found. Ensure the server is running on the configured API URL."
          : error.response?.data?.error || error.message || "Sign-in failed. Please check your credentials.";
      toast({
        title: "Sign-in failed",
        description: messageText,
        variant: "destructive",
      });
      setMessage({
        type: "error",
        text: messageText,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
            <motion.div variants={itemVariants} className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 healthcare-gradient rounded-xl flex items-center justify-center">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">SwasthyaSetu</h1>
            </motion.div>
            <motion.p variants={itemVariants} className="text-xl text-gray-600">
              Choose your role to access your personalized dashboard
            </motion.p>
          </div>

          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
            {roles.map((role, index) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="cursor-pointer border-2 hover:border-blue-300 hover:shadow-xl transition-all duration-300"
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 ${role.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <role.icon className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{role.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <CardDescription className="text-gray-600 text-lg">{role.description}</CardDescription>
                    <Button className="mt-4 w-full" variant="outline">
                      Continue as {role.title}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const currentRole = roles.find((r) => r.id === selectedRole)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div key="auth-form" initial="hidden" animate="visible" variants={containerVariants} className="w-full max-w-md">
        <div className="text-center mb-8">
          <button
            onClick={() => setSelectedRole(null)}
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Change Role
          </button>
          <motion.div variants={itemVariants} className="flex items-center justify-center space-x-3 mb-4">
            <div className={`w-12 h-12 ${currentRole.color} rounded-xl flex items-center justify-center`}>
              <currentRole.icon className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">{currentRole.title} Portal</h1>
              <p className="text-gray-600">{currentRole.description}</p>
            </div>
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-xl">
            <CardHeader>
              <Tabs value={authMode} onValueChange={(value: any) => setAuthMode(value)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-6">
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Sign in to access your {currentRole.title.toLowerCase()} dashboard</CardDescription>
                </TabsContent>

                <TabsContent value="register" className="mt-6">
                  <CardTitle>Create Account</CardTitle>
                  <CardDescription>Join SwasthyaSetu as a {currentRole.title.toLowerCase()}</CardDescription>
                </TabsContent>
              </Tabs>
            </CardHeader>

            <CardContent>
              {message && (
                <div className={`mb-4 p-2 text-center ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"} rounded`}>
                  {message.text}
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <AnimatePresence mode="wait">
                  {authMode === "register" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input id="firstName" placeholder="Rajesh" value={formData.firstName} onChange={handleInputChange} />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input id="lastName" placeholder="Kumar" value={formData.lastName} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone_no">Mobile Number</Label>
                        <Input id="phone_no" type="tel" placeholder="+91 98765 43210" value={formData.phone_no} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="gender">Gender</Label>
                        <Select onValueChange={handleGenderChange} value={formData.gender}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="age">Age</Label>
                        <Input id="age" type="number" placeholder="30" value={formData.age} onChange={handleInputChange} min="1" />
                      </div>
                      {selectedRole === "doctor" && (
                        <div>
                          <Label htmlFor="specialization">Specialization</Label>
                          <Input
                            id="specialization"
                            placeholder="e.g., Cardiology"
                            value={formData.specialization}
                            onChange={handleInputChange}
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {requiresHospital && (
                  <div>
                    <Label htmlFor="hospitalId">Hospital</Label>
                    <Select
                      value={formData.hospitalId}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, hospitalId: value }))}
                      disabled={hospitalLoading || hospitalOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            hospitalLoading
                              ? "Loading hospitals..."
                              : hospitalOptions.length
                              ? "Select hospital"
                              : "No hospitals available"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {hospitalOptions.map((hospital) => {
                          const locationParts = [hospital.city, hospital.state].filter(Boolean);
                          const location = locationParts.length ? ` (${locationParts.join(", ")})` : "";
                          return (
                            <SelectItem key={hospital.id} value={hospital.id}>
                              {hospital.name}
                              {location}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="ample.com" value={formData.email} onChange={handleInputChange} />
                </div>

                <div>
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {authMode === "login" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="ml-2 text-sm text-gray-600">Remember me</span>
                    </label>
                    <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
                      <DialogTrigger asChild>
                        <button type="button" className="text-sm text-blue-600 hover:text-blue-500">
                          Forgot password?
                        </button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle>Reset Password</DialogTitle>
                          <DialogDescription>
                            Enter your email address and we&apos;ll send you a link to reset your password.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleForgotPassword} className="space-y-4">
                          {forgotPasswordMessage && (
                            <div className={`p-3 text-center rounded ${forgotPasswordMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                              {forgotPasswordMessage.text}
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label htmlFor="forgot-email">Email</Label>
                            <Input
                              id="forgot-email"
                              type="email"
                              placeholder="Enter your email address"
                              value={forgotPasswordEmail}
                              onChange={(e) => setForgotPasswordEmail(e.target.value)}
                              required
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={() => setForgotPasswordOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={forgotPasswordLoading}>
                              {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                <Button type="submit" className="w-full healthcare-gradient" disabled={isLoading}>
                  {isLoading ? "Processing..." : authMode === "login" ? "Sign In" : "Create Account"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">Or continue with</span>
                  </div>
                </div>

                <Button variant="outline" type="button" className="w-full" disabled={isLoading}>
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
