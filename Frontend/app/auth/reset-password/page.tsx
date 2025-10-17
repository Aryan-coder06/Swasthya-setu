"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hashParams, setHashParams] = useState<Record<string, string>>({});
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Extract all parameters from URL hash (fragment)
    const hash = window.location.hash.substring(1); // Remove the '#' character
    const urlParams = new URLSearchParams(hash);
    
    // Convert URLSearchParams to object
    const params: Record<string, string> = {};
    urlParams.forEach((value, key) => {
      params[key] = value;
    });
    
    setHashParams(params);
    console.log('Extracted hash parameters:', params);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const validatePasswords = () => {
    if (formData.newPassword.length < 6) {
      setMessage({ type: "error", text: "Password must be at least 6 characters long." });
      return false;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return false;
    }
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validatePasswords()) {
      return;
    }

    if (!hashParams.access_token) {
      setMessage({ type: "error", text: "Invalid or missing access token. Please request a new password reset link." });
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/auth/reset-password', {
        ...hashParams, // Send all hash parameters (access_token, refresh_token, etc.)
        new_password: formData.newPassword
      });
      
      setMessage({ type: "success", text: "Password reset successfully! Redirecting to login..." });
      setTimeout(() => {
        router.push('/auth');
      }, 2000);
    } catch (error: any) {
      console.error('Reset password error:', error);
      setMessage({
        type: "error",
        text: error.response?.data?.error || error.message || "Failed to reset password. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/auth" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Sign In
          </Link>
          <motion.div variants={itemVariants} className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 healthcare-gradient rounded-xl flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">SwasthyaSetu</h1>
          </motion.div>
          <motion.p variants={itemVariants} className="text-xl text-gray-600">
            Reset Your Password
          </motion.p>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Create New Password</CardTitle>
              <CardDescription>
                Enter your new password below. Make sure it's secure and easy to remember.
              </CardDescription>
            </CardHeader>

            <CardContent>
              {message && (
                <div className={`mb-4 p-3 text-center rounded ${message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {message.text}
                </div>
              )}
              
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      required
                      minLength={6}
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

                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter new password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" className="w-full healthcare-gradient" disabled={isLoading}>
                  {isLoading ? "Resetting Password..." : "Reset Password"}
                </Button>

                <div className="text-center">
                  <Link href="/auth" className="text-sm text-blue-600 hover:text-blue-500">
                    Remember your password? Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}