"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone,
  MapPin,
  Clock,
  AlertTriangle,
  Navigation,
  Users,
  Heart,
  Activity,
  Zap,
  Shield,
  Truck,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export default function EmergencySOSPage() {
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [ambulanceStatus, setAmbulanceStatus] = useState<"dispatched" | "enroute" | "arrived" | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [currentLocation, setCurrentLocation] = useState("123 Main Street, Downtown");
  const { toast } = useToast();

  const emergencyContacts = [
    { name: "Sarah Johnson", relation: "Spouse", phone: "+91 98765 43210", avatar: "SJ" },
    { name: "Robert Johnson Sr.", relation: "Father", phone: "+91 98765 43211", avatar: "RJ" },
    { name: "Mary Johnson", relation: "Mother", phone: "+91 98765 43212", avatar: "MJ" },
    { name: "Dr. Sarah Wilson", relation: "Family Doctor", phone: "+91 98765 43213", avatar: "SW" }
  ];

  const nearbyHospitals = [
    { name: "City General Hospital", distance: "2.3 km", eta: "8 mins", beds: "Available" },
    { name: "Emergency Care Center", distance: "3.1 km", eta: "12 mins", beds: "Available" },
    { name: "Metro Health Hospital", distance: "4.5 km", eta: "15 mins", beds: "Limited" }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (emergencyActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [emergencyActive, countdown]);

  const handleEmergencyCall = () => {
    setEmergencyActive(true);
    setCountdown(300); // 5 minutes countdown
    setAmbulanceStatus("dispatched");
    
    toast({
      title: "Emergency Alert Sent!",
      description: "Ambulance dispatched. Emergency contacts notified.",
    });

    // Simulate ambulance status updates
    setTimeout(() => setAmbulanceStatus("enroute"), 3000);
    setTimeout(() => setAmbulanceStatus("arrived"), 10000);
  };

  const handleCancelEmergency = () => {
    setEmergencyActive(false);
    setAmbulanceStatus(null);
    setCountdown(0);
    
    toast({
      title: "Emergency Cancelled",
      description: "Emergency request has been cancelled.",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAmbulanceStatusColor = (status: string) => {
    switch (status) {
      case "dispatched": return "bg-yellow-100 text-yellow-800";
      case "enroute": return "bg-blue-100 text-blue-800";
      case "arrived": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Emergency SOS</h1>
        <p className="text-gray-600 mt-2">Get immediate medical assistance in case of emergency</p>
      </motion.div>

      {/* Emergency Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center"
      >
        <div className="relative">
          <motion.div
            animate={emergencyActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: emergencyActive ? Infinity : 0, duration: 1 }}
          >
            <Button
              size="lg"
              className={`w-48 h-48 rounded-full text-2xl font-bold ${
                emergencyActive 
                  ? "bg-red-600 hover:bg-red-700 animate-pulse" 
                  : "bg-red-500 hover:bg-red-600"
              } text-white shadow-2xl`}
              onClick={emergencyActive ? handleCancelEmergency : handleEmergencyCall}
            >
              <div className="flex flex-col items-center space-y-2">
                <Phone className="w-12 h-12" />
                <span>{emergencyActive ? "CANCEL" : "SOS"}</span>
                <span className="text-sm font-normal">
                  {emergencyActive ? "Emergency" : "Emergency Call"}
                </span>
              </div>
            </Button>
          </motion.div>
          
          {emergencyActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute -bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <Badge className="bg-red-100 text-red-800 text-lg px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                {formatTime(countdown)}
              </Badge>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Emergency Status */}
      <AnimatePresence>
        {emergencyActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Emergency Active
                </CardTitle>
                <CardDescription className="text-red-700">
                  Emergency services have been contacted. Help is on the way.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-medium">Current Location</div>
                      <div className="text-sm text-gray-600">{currentLocation}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Truck className="w-5 h-5 text-red-600" />
                    <div>
                      <div className="font-medium">Ambulance Status</div>
                      <Badge className={getAmbulanceStatusColor(ambulanceStatus || "")}>
                        {ambulanceStatus?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Mock GPS Tracking */}
                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Live Tracking</h4>
                    <Badge variant="outline">
                      <Activity className="w-3 h-3 mr-1" />
                      Live
                    </Badge>
                  </div>
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Navigation className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                      <p className="text-lg font-medium text-gray-700">GPS Tracking Active</p>
                      <p className="text-gray-500">Ambulance location would be displayed here</p>
                      {ambulanceStatus === "enroute" && (
                        <p className="text-blue-600 font-medium mt-2">ETA: 6 minutes</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Emergency Contacts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Emergency Contacts
              </CardTitle>
              <CardDescription>
                These contacts will be automatically notified in case of emergency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emergencyContacts.map((contact, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    emergencyActive ? "bg-green-50 border-green-200" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {contact.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-sm text-gray-600">{contact.relation}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{contact.phone}</span>
                    {emergencyActive && (
                      <Badge className="bg-green-100 text-green-800">
                        Notified
                      </Badge>
                    )}
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Nearby Hospitals */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Nearby Hospitals
              </CardTitle>
              <CardDescription>
                Emergency facilities in your area
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {nearbyHospitals.map((hospital, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                >
                  <div>
                    <div className="font-medium">{hospital.name}</div>
                    <div className="text-sm text-gray-600">
                      {hospital.distance} • {hospital.eta}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={
                      hospital.beds === "Available" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }>
                      {hospital.beds}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Emergency Numbers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Emergency Numbers
            </CardTitle>
            <CardDescription>
              Important emergency contact numbers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { service: "Ambulance", number: "108", icon: Truck },
                { service: "Fire Department", number: "101", icon: Zap },
                { service: "Police", number: "100", icon: Shield }
              ].map((emergency, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <emergency.icon className="w-6 h-6 text-red-600" />
                    <div>
                      <div className="font-medium">{emergency.service}</div>
                      <div className="text-2xl font-bold text-red-600">{emergency.number}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Phone className="w-3 h-3 mr-1" />
                    Call
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}