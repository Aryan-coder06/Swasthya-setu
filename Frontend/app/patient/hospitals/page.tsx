"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Search,
  Filter,
  Star,
  Phone,
  Clock,
  Bed,
  Calendar,
  Navigation,
  Heart,
  Stethoscope,
  Users,
  Award,
  Wifi,
  Car,
  Coffee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function HospitalsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [maxDistance, setMaxDistance] = useState([10]);
  const [maxFees, setMaxFees] = useState([2000]);
  const [minRating, setMinRating] = useState([4]);

  const hospitals = [
    {
      id: 1,
      name: "City General Hospital",
      rating: 4.8,
      reviews: 1250,
      distance: "2.3 km",
      consultationFee: "₹500-800",
      specialties: ["Cardiology", "Neurology", "Orthopedics"],
      address: "123 Medical District, Downtown",
      phone: "+91 98765 43210",
      beds: { total: 200, available: 45 },
      facilities: ["Emergency", "ICU", "Pharmacy", "Lab", "Parking", "WiFi"],
      image: "https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=400",
      timings: "24/7",
      type: "Multi-specialty"
    },
    {
      id: 2,
      name: "Heart Care Center",
      rating: 4.9,
      reviews: 890,
      distance: "1.8 km",
      consultationFee: "₹800-1200",
      specialties: ["Cardiology", "Cardiac Surgery"],
      address: "456 Heart Street, Medical Plaza",
      phone: "+91 98765 43211",
      beds: { total: 80, available: 12 },
      facilities: ["Emergency", "ICU", "Cath Lab", "Parking"],
      image: "https://images.pexels.com/photos/668300/pexels-photo-668300.jpeg?auto=compress&cs=tinysrgb&w=400",
      timings: "6:00 AM - 10:00 PM",
      type: "Specialty"
    },
    {
      id: 3,
      name: "Metro Health Center",
      rating: 4.6,
      reviews: 2100,
      distance: "3.5 km",
      consultationFee: "₹300-600",
      specialties: ["General Medicine", "Pediatrics", "Dermatology"],
      address: "789 Metro Avenue, Central District",
      phone: "+91 98765 43212",
      beds: { total: 150, available: 28 },
      facilities: ["Emergency", "Pharmacy", "Lab", "Cafeteria", "WiFi"],
      image: "https://images.pexels.com/photos/1170979/pexels-photo-1170979.jpeg?auto=compress&cs=tinysrgb&w=400",
      timings: "24/7",
      type: "Multi-specialty"
    },
    {
      id: 4,
      name: "Children's Hospital",
      rating: 4.7,
      reviews: 650,
      distance: "4.2 km",
      consultationFee: "₹400-700",
      specialties: ["Pediatrics", "Neonatology", "Child Surgery"],
      address: "321 Kids Lane, Family District",
      phone: "+91 98765 43213",
      beds: { total: 100, available: 18 },
      facilities: ["NICU", "Pediatric ICU", "Play Area", "Parking"],
      image: "https://images.pexels.com/photos/4386466/pexels-photo-4386466.jpeg?auto=compress&cs=tinysrgb&w=400",
      timings: "24/7",
      type: "Specialty"
    },
    {
      id: 5,
      name: "Orthopedic Institute",
      rating: 4.5,
      reviews: 420,
      distance: "5.1 km",
      consultationFee: "₹600-1000",
      specialties: ["Orthopedics", "Sports Medicine", "Physiotherapy"],
      address: "654 Bone Street, Sports Complex",
      phone: "+91 98765 43214",
      beds: { total: 60, available: 8 },
      facilities: ["Operation Theater", "Physiotherapy", "Sports Medicine"],
      image: "https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=400",
      timings: "8:00 AM - 8:00 PM",
      type: "Specialty"
    }
  ];

  const specialties = [
    "All Specialties", "Cardiology", "Neurology", "Orthopedics", 
    "Pediatrics", "Dermatology", "General Medicine"
  ];

  const getFacilityIcon = (facility: string) => {
    switch (facility.toLowerCase()) {
      case "emergency": return <Heart className="w-4 h-4" />;
      case "icu": return <Stethoscope className="w-4 h-4" />;
      case "parking": return <Car className="w-4 h-4" />;
      case "wifi": return <Wifi className="w-4 h-4" />;
      case "cafeteria": return <Coffee className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find Hospitals</h1>
          <p className="text-gray-600 mt-1">Discover nearby hospitals and healthcare facilities</p>
        </div>
        <Button variant="outline">
          <Navigation className="w-4 h-4 mr-2" />
          Use Current Location
        </Button>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search */}
              <div>
                <Label>Search Hospitals</Label>
                <div className="relative mt-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Hospital name..." 
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Specialty */}
              <div>
                <Label>Specialty</Label>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty.toLowerCase().replace(' ', '-')}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Distance */}
              <div>
                <Label>Maximum Distance: {maxDistance[0]} km</Label>
                <Slider
                  value={maxDistance}
                  onValueChange={setMaxDistance}
                  max={20}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Consultation Fees */}
              <div>
                <Label>Maximum Fees: ₹{maxFees[0]}</Label>
                <Slider
                  value={maxFees}
                  onValueChange={setMaxFees}
                  max={3000}
                  min={200}
                  step={100}
                  className="mt-2"
                />
              </div>

              {/* Rating */}
              <div>
                <Label>Minimum Rating: {minRating[0]} stars</Label>
                <Slider
                  value={minRating}
                  onValueChange={setMinRating}
                  max={5}
                  min={1}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              {/* Facilities */}
              <div>
                <Label>Facilities</Label>
                <div className="space-y-2 mt-2">
                  {["Emergency", "ICU", "Pharmacy", "Lab", "Parking"].map((facility) => (
                    <div key={facility} className="flex items-center space-x-2">
                      <Checkbox id={facility} />
                      <Label htmlFor={facility} className="text-sm">{facility}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          {/* Map Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="p-0">
                <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700">Interactive Map</p>
                    <p className="text-gray-500">Hospital locations would be displayed here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Hospital Cards */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            {hospitals.map((hospital, index) => (
              <motion.div key={hospital.id} variants={itemVariants}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex space-x-4">
                      <img
                        src={hospital.image}
                        alt={hospital.name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900">{hospital.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex items-center">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="ml-1 font-medium">{hospital.rating}</span>
                              </div>
                              <span className="text-gray-500">({hospital.reviews} reviews)</span>
                              <Badge variant="outline">{hospital.type}</Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{hospital.consultationFee}</div>
                            <div className="text-sm text-gray-500">Consultation</div>
                          </div>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span className="text-sm">{hospital.address}</span>
                            <span className="ml-2 text-blue-600 font-medium">{hospital.distance}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            <span className="text-sm">{hospital.timings}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-600">
                            <Bed className="w-4 h-4 mr-2" />
                            <span className="text-sm">
                              {hospital.beds.available} beds available of {hospital.beds.total}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex flex-wrap gap-1 mb-3">
                            {hospital.specialties.map((specialty, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {hospital.facilities.slice(0, 4).map((facility, idx) => (
                              <div key={idx} className="flex items-center text-xs text-gray-600">
                                {getFacilityIcon(facility)}
                                <span className="ml-1">{facility}</span>
                              </div>
                            ))}
                            {hospital.facilities.length > 4 && (
                              <span className="text-xs text-gray-500">
                                +{hospital.facilities.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <Button className="flex-1 healthcare-gradient">
                            <Calendar className="w-4 h-4 mr-2" />
                            Book Appointment
                          </Button>
                          <Button variant="outline">
                            <Phone className="w-4 h-4 mr-2" />
                            Call
                          </Button>
                          <Button variant="outline">
                            <Navigation className="w-4 h-4 mr-2" />
                            Directions
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}