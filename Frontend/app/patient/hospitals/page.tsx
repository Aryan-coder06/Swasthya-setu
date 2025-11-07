"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Search,
  Filter,
  Star,
  Phone,
  Clock,
  Bed,
  Navigation,
  Heart,
  Stethoscope,
  Users,
  Award,
  Wifi,
  Car,
  Coffee,
  LocateFixed,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { toast as notify } from "react-toastify";
import { API_BASE_URL } from "@/config/env";
import { requestAppointment, fetchDoctorsForHospitalApi } from "@/lib/api";
import type { DoctorSummary } from "@/lib/types";

const API_BASE = API_BASE_URL;

type Hospital = {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  review_count?: number;
  type?: string;
  consultation_fee_min?: number;
  consultation_fee_max?: number;
  specialties?: string[];
  facilities?: string[];
  beds_total?: number;
  beds_available?: number;
  opening_hours?: string;
  image_url?: string;
  distance_km?: number;
  source?: string;
  website?: string;
};

const FALLBACK_SPECIALTIES = [
  "all",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Dermatology",
  "General Medicine",
  "Emergency",
];

const PRESET_LOCATIONS: Array<{ id: string; label: string; city?: string; coords?: { lat: number; lng: number }; queries?: string[] }> = [
  { id: "auto", label: "Use My Location" },
  { id: "delhi", label: "New Delhi, Delhi", city: "New Delhi", coords: { lat: 28.6139, lng: 77.2090 }, queries: ["New Delhi", "Delhi"] },
  { id: "andhra-vizag", label: "Visakhapatnam, Andhra Pradesh", city: "Visakhapatnam", coords: { lat: 17.6868, lng: 83.2185 }, queries: ["Visakhapatnam", "Vizag", "Andhra Pradesh"] },
  { id: "arunachal-itanagar", label: "Itanagar, Arunachal Pradesh", city: "Itanagar", coords: { lat: 27.0844, lng: 93.6053 }, queries: ["Itanagar", "Arunachal Pradesh"] },
  { id: "assam-guwahati", label: "Guwahati, Assam", city: "Guwahati", coords: { lat: 26.1445, lng: 91.7362 }, queries: ["Guwahati", "Assam"] },
  { id: "bihar-patna", label: "Patna, Bihar", city: "Patna", coords: { lat: 25.5941, lng: 85.1376 }, queries: ["Patna", "Bihar"] },
  { id: "chhattisgarh-raipur", label: "Raipur, Chhattisgarh", city: "Raipur", coords: { lat: 21.2514, lng: 81.6296 }, queries: ["Raipur", "Chhattisgarh"] },
  { id: "goa-panaji", label: "Panaji, Goa", city: "Panaji", coords: { lat: 15.4909, lng: 73.8278 }, queries: ["Panaji", "Panjim", "Goa"] },
  { id: "gujarat-ahmedabad", label: "Ahmedabad, Gujarat", city: "Ahmedabad", coords: { lat: 23.0225, lng: 72.5714 }, queries: ["Ahmedabad", "Gujarat"] },
  { id: "haryana-gurugram", label: "Gurugram, Haryana", city: "Gurugram", coords: { lat: 28.4595, lng: 77.0266 }, queries: ["Gurugram", "Gurgaon", "Haryana"] },
  { id: "himachal-shimla", label: "Shimla, Himachal Pradesh", city: "Shimla", coords: { lat: 31.1048, lng: 77.1734 }, queries: ["Shimla", "Himachal Pradesh"] },
  { id: "jk-srinagar", label: "Srinagar, Jammu & Kashmir", city: "Srinagar", coords: { lat: 34.0837, lng: 74.7973 }, queries: ["Srinagar", "Jammu", "Kashmir"] },
  { id: "jharkhand-ranchi", label: "Ranchi, Jharkhand", city: "Ranchi", coords: { lat: 23.3441, lng: 85.3096 }, queries: ["Ranchi", "Jharkhand"] },
  { id: "karnataka-bengaluru", label: "Bengaluru, Karnataka", city: "Bengaluru", coords: { lat: 12.9716, lng: 77.5946 }, queries: ["Bengaluru", "Bangalore", "Karnataka"] },
  { id: "kerala-trivandrum", label: "Thiruvananthapuram, Kerala", city: "Thiruvananthapuram", coords: { lat: 8.5241, lng: 76.9366 }, queries: ["Thiruvananthapuram", "Trivandrum", "Kerala"] },
  { id: "madhya-bhopal", label: "Bhopal, Madhya Pradesh", city: "Bhopal", coords: { lat: 23.2599, lng: 77.4126 }, queries: ["Bhopal", "Madhya Pradesh", "MP"] },
  { id: "maharashtra-mumbai", label: "Mumbai, Maharashtra", city: "Mumbai", coords: { lat: 19.0760, lng: 72.8777 }, queries: ["Mumbai", "Bombay", "Maharashtra"] },
  { id: "manipur-imphal", label: "Imphal, Manipur", city: "Imphal", coords: { lat: 24.8170, lng: 93.9368 }, queries: ["Imphal", "Manipur"] },
  { id: "meghalaya-shillong", label: "Shillong, Meghalaya", city: "Shillong", coords: { lat: 25.5788, lng: 91.8933 }, queries: ["Shillong", "Meghalaya"] },
  { id: "mizoram-aizawl", label: "Aizawl, Mizoram", city: "Aizawl", coords: { lat: 23.7271, lng: 92.7176 }, queries: ["Aizawl", "Mizoram"] },
  { id: "nagaland-kohima", label: "Kohima, Nagaland", city: "Kohima", coords: { lat: 25.6751, lng: 94.1086 }, queries: ["Kohima", "Nagaland"] },
  { id: "odisha-bhubaneswar", label: "Bhubaneswar, Odisha", city: "Bhubaneswar", coords: { lat: 20.2961, lng: 85.8245 }, queries: ["Bhubaneswar", "Odisha"] },
  { id: "punjab-amritsar", label: "Amritsar, Punjab", city: "Amritsar", coords: { lat: 31.6340, lng: 74.8723 }, queries: ["Amritsar", "Punjab"] },
  { id: "rajasthan-jaipur", label: "Jaipur, Rajasthan", city: "Jaipur", coords: { lat: 26.9124, lng: 75.7873 }, queries: ["Jaipur", "Rajasthan"] },
  { id: "sikkim-gangtok", label: "Gangtok, Sikkim", city: "Gangtok", coords: { lat: 27.3389, lng: 88.6065 }, queries: ["Gangtok", "Sikkim"] },
  { id: "tamil-chennai", label: "Chennai, Tamil Nadu", city: "Chennai", coords: { lat: 13.0827, lng: 80.2707 }, queries: ["Chennai", "Madras", "Tamil Nadu"] },
  { id: "telangana-hyderabad", label: "Hyderabad, Telangana", city: "Hyderabad", coords: { lat: 17.3850, lng: 78.4867 }, queries: ["Hyderabad", "Telangana"] },
  { id: "tripura-agartala", label: "Agartala, Tripura", city: "Agartala", coords: { lat: 23.8315, lng: 91.2868 }, queries: ["Agartala", "Tripura"] },
  { id: "uttar-lucknow", label: "Lucknow, Uttar Pradesh", city: "Lucknow", coords: { lat: 26.8467, lng: 80.9462 }, queries: ["Lucknow", "Uttar Pradesh", "UP"] },
  { id: "uttar-prayagraj", label: "Prayagraj (Allahabad), Uttar Pradesh", city: "Prayagraj", coords: { lat: 25.4358, lng: 81.8463 }, queries: ["Prayagraj", "Allahabad", "Uttar Pradesh"] },
  { id: "uttarakhand-dehradun", label: "Dehradun, Uttarakhand", city: "Dehradun", coords: { lat: 30.3165, lng: 78.0322 }, queries: ["Dehradun", "Uttarakhand"] },
  { id: "wb-kolkata", label: "Kolkata, West Bengal", city: "Kolkata", coords: { lat: 22.5726, lng: 88.3639 }, queries: ["Kolkata", "Calcutta", "West Bengal"] },
];

function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}

const parseList = (input: unknown): string[] => {
  if (Array.isArray(input)) {
    return input
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean) as string[];
  }
  if (typeof input === "string") {
    return input
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const normalizeUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

export default function HospitalsPage() {
  const { toast: pushToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [maxDistance, setMaxDistance] = useState<number[]>([10]);
  const [minRating, setMinRating] = useState<number[]>([4]);
  const [include24x7, setInclude24x7] = useState(false);

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("auto");
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>("all");
  const [activeCityQueries, setActiveCityQueries] = useState<string[]>([]);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [appointmentHospital, setAppointmentHospital] = useState<Hospital | null>(null);
  const [appointmentDoctors, setAppointmentDoctors] = useState<DoctorSummary[]>([]);
  const [appointmentDoctorId, setAppointmentDoctorId] = useState<string>("");
  const [appointmentPreferredSpecialty, setAppointmentPreferredSpecialty] = useState<string>("");
  const [appointmentPreferredDate, setAppointmentPreferredDate] = useState<string>("");
  const [appointmentPreferredTime, setAppointmentPreferredTime] = useState<string>("");
  const [appointmentNotes, setAppointmentNotes] = useState<string>("");
  const [appointmentDoctorsLoading, setAppointmentDoctorsLoading] = useState(false);
  const [requestingAppointment, setRequestingAppointment] = useState(false);

  const debouncedFilters = useDebounce({
    maxDistanceKm: maxDistance[0],
    minRating: minRating[0],
    specialty: selectedSpecialty,
    include24x7,
  });

  const requestLocation = useCallback(() => {
    if (!("geolocation" in navigator)) {
      pushToast({
        title: "Location access unavailable",
        description: "Geolocation is not supported in this browser. Please search manually.",
        variant: "destructive",
      });
      setLocation({ lat: 28.6139, lng: 77.2090 });
      setSelectedPreset("delhi");
      setActiveCity("New Delhi");
      setActiveCityQueries(["New Delhi", "Delhi"]);
      setSelectedCityFilter("all");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setSelectedPreset("auto");
        setActiveCity(null);
        setActiveCityQueries([]);
        setIsLocating(false);
        pushToast({ title: "Location detected", description: "Fetching hospitals near you." });
      },
      (geoError) => {
        console.error("Geolocation error", geoError);
        setIsLocating(false);
        setError("We couldn&apos;t access your location. Showing hospitals around New Delhi as a fallback.");
        setLocation({ lat: 28.6139, lng: 77.2090 });
        setSelectedPreset("delhi");
        setActiveCity("New Delhi");
        setActiveCityQueries(["New Delhi", "Delhi"]);
        pushToast({
          title: "Location request denied",
          description: "Enable location access in your browser settings to see hospitals closest to you.",
          variant: "destructive",
        });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [pushToast]);

  useEffect(() => {
    const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (!storedUser) return;
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed?.id) {
        setPatientId(parsed.id);
      }
    } catch (error) {
      console.error("Failed to parse stored patient", error);
    }
  }, []);

  const handlePresetChange = useCallback(
    (value: string) => {
      setSelectedPreset(value);
      if (value === "auto") {
        if (userLocation) {
          setLocation(userLocation);
        } else {
          requestLocation();
        }
        setActiveCity(null);
        setSelectedCityFilter("all");
        setActiveCityQueries([]);
        return;
      }

      const match = PRESET_LOCATIONS.find((item) => item.id === value);
      if (match?.coords) {
        setLocation(match.coords);
        setActiveCity(match.label);
        if (match?.queries && match.queries.length > 0) {
          setActiveCityQueries(match.queries);
        } else if (match?.city) {
          setActiveCityQueries([match.city]);
        } else {
          setActiveCityQueries([]);
        }
        setSelectedCityFilter("all");
      }
    },
    [requestLocation, userLocation]
  );

  const handleCityFilterChange = useCallback(
    (value: string) => {
      setSelectedCityFilter(value);
      if (value === "all") {
        const preset = PRESET_LOCATIONS.find((item) => item.id === selectedPreset);
        setActiveCity(preset?.id === "auto" ? null : preset?.label ?? null);
        if (preset?.queries && preset.queries.length > 0) {
          setActiveCityQueries(preset.queries);
        } else if (preset?.city) {
          setActiveCityQueries([preset.city]);
        } else {
          setActiveCityQueries([]);
        }
        if (selectedPreset === "auto" && userLocation) {
          setLocation(userLocation);
        }
        return;
      }

      setActiveCity(value);
      setActiveCityQueries([value]);
      const matchFromData = hospitals.find(
        (hospital) =>
          hospital.city &&
          hospital.city.toLowerCase() === value.toLowerCase() &&
          typeof hospital.latitude === "number" &&
          typeof hospital.longitude === "number"
      );

      if (matchFromData && typeof matchFromData.latitude === "number" && typeof matchFromData.longitude === "number") {
        setLocation({ lat: matchFromData.latitude, lng: matchFromData.longitude });
        return;
      }

      const presetMatch = PRESET_LOCATIONS.find(
        (preset) => preset.city && preset.city.toLowerCase() === value.toLowerCase()
      );
      if (presetMatch?.coords) {
        setLocation(presetMatch.coords);
      }
    },
    [hospitals, selectedPreset, userLocation]
  );

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const fetchHospitals = useCallback(
    async (signal?: AbortSignal) => {
      if (!location) return;
      setIsLoading(true);
      setError(null);

      try {
        const cityQueries = new Set<string>();
        if (selectedCityFilter !== "all") {
          cityQueries.add(selectedCityFilter);
        }
        activeCityQueries.forEach((entry) => cityQueries.add(entry));
        const queryList = Array.from(cityQueries);
        const primaryCity = queryList.length > 0 ? queryList[0] : undefined;
        const secondaryCities = queryList.length > 1 ? queryList.slice(1) : undefined;

        const response = await fetch(`${API_BASE}/patient/hospitals/nearby`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: location.lat,
            longitude: location.lng,
            maxDistanceKm: debouncedFilters.maxDistanceKm,
            minRating: debouncedFilters.minRating,
            specialty: debouncedFilters.specialty,
            city: primaryCity,
            cities: secondaryCities,
            limit: 40,
          }),
          signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.error || "Failed to fetch hospitals");
        }

        const payload = await response.json();
        const items: Hospital[] = (payload?.data || []).map((hospital: any) => ({
          id: String(hospital.id),
          name: hospital.name,
          address: hospital.address,
          city: hospital.city,
          state: hospital.state,
          postal_code: hospital.postal_code,
          phone: hospital.phone,
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          rating: hospital.rating,
          review_count: hospital.review_count,
          type: hospital.type,
          consultation_fee_min: hospital.consultation_fee_min,
          consultation_fee_max: hospital.consultation_fee_max,
          specialties: parseList(hospital.specialties),
          facilities: parseList(hospital.facilities),
          beds_total: hospital.beds_total,
          beds_available: hospital.beds_available,
          opening_hours: hospital.opening_hours,
          image_url: hospital.image_url,
          source: hospital.source,
          website: normalizeUrl(hospital.website || hospital.contact_website),
          distance_km: typeof hospital.distance_km === "number" ? hospital.distance_km : null,
        }));

        setHospitals(items);
        if (items.length > 0) {
          setSelectedHospitalId(items[0].id);
        }
      } catch (fetchError: any) {
        if (fetchError.name === "AbortError") return;
        console.error("Hospital fetch error", fetchError);
        setError(fetchError.message || "Unable to fetch hospitals right now.");
        pushToast({
          title: "Could not load hospitals",
          description: fetchError.message || "Please try again in a moment.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [location, debouncedFilters, pushToast, selectedCityFilter, activeCityQueries]
  );

  useEffect(() => {
    if (!location) return;
    const controller = new AbortController();
    fetchHospitals(controller.signal);
    return () => controller.abort();
  }, [location, debouncedFilters, fetchHospitals]);

  const specialtiesFromData = useMemo(() => {
    const collected = new Set<string>();
    hospitals.forEach((hospital) => {
      parseList(hospital.specialties).forEach((spec) => collected.add(spec));
    });
    return ["all", ...Array.from(collected).sort((a, b) => a.localeCompare(b))];
  }, [hospitals]);

  const cityOptions = useMemo(() => {
    const cityMap = new Map<string, string>();
    hospitals.forEach((hospital) => {
      const rawCity = hospital.city?.trim();
      if (!rawCity) return;
      const key = rawCity.toLowerCase();
      if (!cityMap.has(key)) {
        cityMap.set(key, rawCity);
      }
    });
    const ordered = Array.from(cityMap.values()).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    return ["all", ...ordered.slice(0, 60)];
  }, [hospitals]);

  const filteredHospitals = useMemo(() => {
    return hospitals
      .filter((hospital) => {
        if (include24x7 && hospital.opening_hours) {
          if (!hospital.opening_hours.toLowerCase().includes("24")) {
            return false;
          }
        }
        return true;
      })
      .filter((hospital) => {
        if (!searchQuery) return true;
        const term = searchQuery.toLowerCase();
        return (
          hospital.name.toLowerCase().includes(term) ||
          (hospital.address && hospital.address.toLowerCase().includes(term)) ||
          (hospital.city && hospital.city.toLowerCase().includes(term))
        );
      })
      .filter((hospital) => {
        if (selectedSpecialty === "all") return true;
        const list = parseList(hospital.specialties);
        return list.some((spec) => spec.toLowerCase().includes(selectedSpecialty.toLowerCase()));
      });
  }, [hospitals, include24x7, searchQuery, selectedSpecialty]);

  const selectedHospital = useMemo(() => {
    if (!selectedHospitalId) return null;
    return filteredHospitals.find((hospital) => hospital.id === selectedHospitalId) || null;
  }, [filteredHospitals, selectedHospitalId]);

  const INITIAL_VISIBLE = 9;
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [selectedSpecialty, include24x7, activeCity, searchQuery]);

  const displayedHospitals = useMemo(() => {
    return filteredHospitals.slice(0, visibleCount);
  }, [filteredHospitals, visibleCount]);

  const selectedHasCoords =
    typeof selectedHospital?.latitude === "number" && typeof selectedHospital?.longitude === "number";
  const userHasCoords =
    typeof location?.lat === "number" && typeof location?.lng === "number";

  const mapEmbedUrl = selectedHasCoords
    ? `https://maps.google.com/maps?q=${selectedHospital!.latitude},${selectedHospital!.longitude}&z=15&output=embed`
    : userHasCoords
      ? `https://maps.google.com/maps?q=${location!.lat},${location!.lng}&z=12&output=embed`
      : "https://maps.google.com/maps?q=india&z=4&output=embed";

  const handleOpenInMaps = () => {
    const targetLat = selectedHospital?.latitude ?? location?.lat;
    const targetLng = selectedHospital?.longitude ?? location?.lng;
    if (!targetLat || !targetLng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`;
    window.open(url, "_blank");
  };

  const appointmentSpecialties = useMemo(() => {
    if (!appointmentHospital) return [];
    return parseList(appointmentHospital.specialties).filter(
      (entry) => entry && entry.toLowerCase() !== "all"
    );
  }, [appointmentHospital]);

  useEffect(() => {
    if (appointmentSpecialties.length && !appointmentPreferredSpecialty) {
      setAppointmentPreferredSpecialty(appointmentSpecialties[0]);
    }
  }, [appointmentSpecialties, appointmentPreferredSpecialty]);

  const resetAppointmentForm = () => {
    setAppointmentDoctorId("");
    setAppointmentPreferredSpecialty("");
    setAppointmentPreferredDate("");
    setAppointmentPreferredTime("");
    setAppointmentNotes("");
  };

  const handleOpenAppointmentDialog = async (hospital: Hospital) => {
    setSelectedHospitalId(hospital.id);
    setAppointmentHospital(hospital);
    setAppointmentDialogOpen(true);
    setAppointmentDoctors([]);
    resetAppointmentForm();
    const specialties = parseList(hospital.specialties).filter(
      (entry) => entry && entry.toLowerCase() !== "all"
    );
    if (specialties.length) {
      setAppointmentPreferredSpecialty(specialties[0]);
    }
    if (!hospital.id) {
      return;
    }
    setAppointmentDoctorsLoading(true);
    try {
      const doctorsList = await fetchDoctorsForHospitalApi(hospital.id);
      setAppointmentDoctors(doctorsList);
      if (doctorsList.length) {
        setAppointmentDoctorId(doctorsList[0].id);
      }
    } catch (error: any) {
      console.error("Doctor lookup failed", error);
      pushToast({
        title: "Doctor directory unavailable",
        description: "We couldn&apos;t load doctors for this hospital. You can still submit a request for any available doctor.",
        variant: "destructive",
      });
    } finally {
      setAppointmentDoctorsLoading(false);
    }
  };

  const handleSubmitAppointmentRequest = async () => {
    if (!patientId) {
      notify.error("Please sign in again before requesting an appointment.");
      return;
    }
    if (!appointmentHospital) {
      notify.error("Choose a hospital before submitting your request.");
      return;
    }
    try {
      setRequestingAppointment(true);
      await requestAppointment({
        patientId,
        hospitalId: appointmentHospital.id,
        doctorId: appointmentDoctorId || undefined,
        preferredSpecialty: appointmentPreferredSpecialty || undefined,
        preferredDate: appointmentPreferredDate || undefined,
        preferredTime: appointmentPreferredTime || undefined,
        notes: appointmentNotes || undefined,
      });
      notify.success("Appointment request submitted. Reception will confirm shortly.");
      setAppointmentDialogOpen(false);
      resetAppointmentForm();
    } catch (error: any) {
      console.error("Appointment request error:", error);
      notify.error(error?.message || "Unable to submit appointment request.");
    } finally {
      setRequestingAppointment(false);
    }
  };

  const getFacilityIcon = (facility: string) => {
    switch (facility.toLowerCase()) {
      case "emergency":
        return <Heart className="w-4 h-4" />;
      case "icu":
      case "nicu":
        return <Stethoscope className="w-4 h-4" />;
      case "parking":
        return <Car className="w-4 h-4" />;
      case "wifi":
        return <Wifi className="w-4 h-4" />;
      case "cafeteria":
      case "food":
        return <Coffee className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { y: 15, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const isEmptyState = !isLoading && filteredHospitals.length === 0;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find Hospitals</h1>
          <p className="text-gray-600 mt-1">
            Discover nearby hospitals, compare facilities, and book your next visit with confidence.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={requestLocation} disabled={isLocating}>
            {isLocating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
            {isLocating ? "Locating..." : "Use Current Location"}
          </Button>
        </div>
      </motion.div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
              <CardDescription>Adjust filters to refine nearby hospitals.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-sm font-medium">Search Hospitals</Label>
                <div className="relative mt-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Hospital name, locality, city..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Specialty</Label>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {(specialtiesFromData.length > 1 ? specialtiesFromData : FALLBACK_SPECIALTIES).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option === "all" ? "All Specialties" : option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Quick Location</Label>
                <Select value={selectedPreset} onValueChange={handlePresetChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose location" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRESET_LOCATIONS.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {cityOptions.length > 1 && (
                <div>
                  <Label className="text-sm font-medium">City (from dataset)</Label>
                  <Select value={selectedCityFilter} onValueChange={handleCityFilterChange}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {cityOptions.map((cityOption) => (
                        <SelectItem key={cityOption} value={cityOption}>
                          {cityOption === "all" ? "All Cities" : cityOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Maximum Distance</Label>
                  <span className="text-xs text-gray-500">{maxDistance[0]} km</span>
                </div>
                <Slider
                  min={2}
                  max={30}
                  step={1}
                  value={maxDistance}
                  onValueChange={setMaxDistance}
                  className="mt-4"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Minimum Rating</Label>
                  <span className="text-xs text-gray-500">{minRating[0].toFixed(1)}+</span>
                </div>
                <Slider
                  min={3}
                  max={5}
                  step={0.1}
                  value={minRating}
                  onValueChange={setMinRating}
                  className="mt-4"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox id="open24" checked={include24x7} onCheckedChange={(checked) => setInclude24x7(Boolean(checked))} />
                <Label htmlFor="open24" className="text-sm">Only 24/7 hospitals</Label>
              </div>

              <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <LocateFixed className="h-3.5 w-3.5" /> Location tips
                </p>
                <p>
                  We use your current coordinates to find hospitals within the selected radius. Adjust filters or search to refine further.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="lg:col-span-3 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Nearby Hospitals
                </CardTitle>
                <CardDescription>
                  {activeCity
                    ? `Showing hospitals around ${activeCity}.`
                    : location
                      ? `Showing results within ${debouncedFilters.maxDistanceKm} km of your location.`
                      : "Share your location or choose a city to receive tailored results."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <Card key={idx} className="p-4 space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-16" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : isEmptyState ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <MapPin className="h-10 w-10 text-gray-400" />
                    <h3 className="text-lg font-semibold">No hospitals match your filters</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      Try broadening your distance range or removing the specialty filter to discover more options.
                    </p>
                  </div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {displayedHospitals.map((hospital) => {
                      const isActive = hospital.id === selectedHospitalId;
                      const distanceLabel = hospital.distance_km
                        ? `${hospital.distance_km.toFixed(1)} km`
                        : activeCity
                          ? `Around ${activeCity}`
                          : "—";
                      const specialties = parseList(hospital.specialties);
                      const facilities = parseList(hospital.facilities);
                      const feeLabel = hospital.consultation_fee_min
                        ? `₹${hospital.consultation_fee_min}${hospital.consultation_fee_max ? ` - ₹${hospital.consultation_fee_max}` : ""}`
                        : "Fee info unavailable";

                      function ensureHttps(website: string): string | undefined {
                        throw new Error("Function not implemented.");
                      }

                      return (
                        <motion.div key={hospital.id} variants={itemVariants}>
                          <Card
                            onClick={() => setSelectedHospitalId(hospital.id)}
                            className={`cursor-pointer transition-shadow hover:shadow-lg ${isActive ? "border-primary shadow-lg" : ""}`}
                          >
                            {hospital.image_url && (
                              <div className="h-32 w-full overflow-hidden rounded-t-lg">
                                <img
                                  src={hospital.image_url}
                                  alt={hospital.name}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <CardHeader className="space-y-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <CardTitle className="text-lg leading-snug">{hospital.name}</CardTitle>
                                  <CardDescription className="text-sm">
                                    {hospital.address || hospital.city || "Address not available"}
                                  </CardDescription>
                                </div>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Star className="h-3.5 w-3.5 text-amber-500" />
                                  <span>{hospital.rating?.toFixed(1) ?? "4.0"}</span>
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5" />
                                  {distanceLabel}
                                </span>
                                {hospital.review_count ? (
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3.5 w-3.5" />
                                    {hospital.review_count.toLocaleString()} reviews
                                  </span>
                                ) : null}
                                {hospital.type && <span>{hospital.type}</span>}
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                <span>{hospital.opening_hours || "Timings not provided"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                {hospital.phone ? (
                                  <a href={`tel:${hospital.phone}`} className="text-primary hover:underline">
                                    {hospital.phone}
                                  </a>
                                ) : (
                                  <span>Not available</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Bed className="h-4 w-4" />
                                <span>
                                  Availability: {hospital.beds_available ?? "?"}/{hospital.beds_total ?? "?"} beds
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Heart className="h-4 w-4" />
                                <span>{feeLabel}</span>
                              </div>
                              {specialties.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {specialties.slice(0, 4).map((specialty) => (
                                    <Badge key={specialty} variant="outline" className="text-xs">
                                      {specialty}
                                    </Badge>
                                  ))}
                                  {specialties.length > 4 && (
                                    <Badge variant="outline" className="text-xs">+{specialties.length - 4}</Badge>
                                  )}
                                </div>
                              )}
                              {facilities.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {facilities.slice(0, 4).map((facility) => (
                                    <span key={facility} className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs text-muted-foreground">
                                      {getFacilityIcon(facility)}
                                      {facility}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                {hospital.state && <span>{hospital.state}</span>}
                                {hospital.postal_code && <span>PIN: {hospital.postal_code}</span>}
                                {hospital.city && <span>{hospital.city}</span>}
                              </div>
                              {hospital.image_url && (
                                <a
                                  href={hospital.image_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary hover:underline"
                                >
                                  View image
                                </a>
                              )}
                              {hospital.source && (
                                <p className="text-xs text-muted-foreground">Source: {hospital.source}</p>
                              )}
                              <div className="flex flex-wrap gap-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleOpenAppointmentDialog(hospital);
                                  }}
                                >
                                  Request appointment
                                </Button>
                                {hospital.website && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    asChild
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <a href={ensureHttps(hospital.website)} target="_blank" rel="noopener noreferrer">
                                      Visit website
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
                {filteredHospitals.length > displayedHospitals.length && (
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" onClick={() => setVisibleCount((prev) => prev + 6)}>
                      Show more hospitals
                    </Button>
                  </div>
                )}
                {filteredHospitals.length > INITIAL_VISIBLE && displayedHospitals.length > INITIAL_VISIBLE && (
                  <div className="mt-2 flex justify-center">
                    <Button variant="ghost" size="sm" onClick={() => setVisibleCount(INITIAL_VISIBLE)}>
                      Show fewer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    {selectedHospital
                      ? selectedHospital.name
                      : activeCity
                        ? `Hospitals near ${activeCity}`
                        : "Map Preview"}
                  </CardTitle>
                  <CardDescription>
                    {selectedHospital
                      ? selectedHospital.address || "Navigate to the selected hospital"
                      : activeCity
                        ? "Select a hospital card to view directions or open the area in Google Maps."
                        : "Select a hospital to preview directions."}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => fetchHospitals()} disabled={isLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleOpenInMaps} disabled={!selectedHospital}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in Maps
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="h-[360px] p-0">
                <iframe
                  title="Hospital map preview"
                  src={mapEmbedUrl}
                  loading="lazy"
                  className="h-full w-full border-0"
                  allowFullScreen
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <Dialog
        open={appointmentDialogOpen}
        onOpenChange={(open) => {
          setAppointmentDialogOpen(open);
          if (!open) {
            setAppointmentHospital(null);
            setAppointmentDoctors([]);
            resetAppointmentForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request an appointment</DialogTitle>
            <DialogDescription>
              {appointmentHospital
                ? `Share your preferences and the reception at ${appointmentHospital.name} will confirm the slot.`
                : "Select a hospital to request an appointment."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Preferred doctor</Label>
              {appointmentDoctorsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={appointmentDoctorId}
                  onValueChange={setAppointmentDoctorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any available doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any available doctor</SelectItem>
                    {appointmentDoctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {`Dr. ${doctor.firstName ?? ""} ${doctor.lastName ?? ""}`.trim()}
                        {doctor.specs ? ` • ${doctor.specs}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-muted-foreground">
                Leave this as “Any” and the receptionist will match you with the best available doctor.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Specialty preference</Label>
              <Select
                value={appointmentPreferredSpecialty}
                onValueChange={setAppointmentPreferredSpecialty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any specialty</SelectItem>
                  {appointmentSpecialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appointment-preferred-date">Preferred date</Label>
                <Input
                  id="appointment-preferred-date"
                  type="date"
                  value={appointmentPreferredDate}
                  onChange={(event) => setAppointmentPreferredDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-preferred-time">Preferred time</Label>
                <Input
                  id="appointment-preferred-time"
                  type="time"
                  value={appointmentPreferredTime}
                  onChange={(event) => setAppointmentPreferredTime(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment-notes">Additional notes</Label>
              <Textarea
                id="appointment-notes"
                value={appointmentNotes}
                onChange={(event) => setAppointmentNotes(event.target.value)}
                placeholder="Share symptoms, previous reports, or scheduling constraints."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAppointmentDialogOpen(false)}
              disabled={requestingAppointment}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitAppointmentRequest} disabled={requestingAppointment}>
              {requestingAppointment ? "Submitting..." : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
