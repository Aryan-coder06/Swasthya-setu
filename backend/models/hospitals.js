import { supabaseAdmin } from "../lib/supabase.js";
import { HOSPITALS_TABLE } from "../config/constants.js";

const toRadians = (deg) => (deg * Math.PI) / 180;

const haversineDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[;,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const FALLBACK_HOSPITALS = [
  {
    id: "fallback-apollo",
    name: "Apollo Hospitals, Greams Road",
    address: "21, Greams Lane, Thousand Lights",
    city: "Chennai",
    state: "Tamil Nadu",
    postal_code: "600006",
    phone: "+91-44-4040-1066",
    latitude: 13.0615,
    longitude: 80.259,
    rating: 4.7,
    review_count: 5230,
    type: "Multi-specialty",
    consultation_fee_min: 700,
    consultation_fee_max: 1200,
    specialties: ["Cardiology", "Oncology", "Neurology", "Transplants"],
    facilities: ["Emergency", "ICU", "Pharmacy", "Lab", "Parking", "WiFi"],
    beds_total: 600,
    beds_available: 110,
    opening_hours: "24/7",
    image_url: "https://images.unsplash.com/photo-1582718860607-7e4dbd91e6d1?auto=format&fit=crop&w=900&q=80",
    source: "fallback"
  },
  {
    id: "fallback-fortis",
    name: "Fortis Memorial Research Institute",
    address: "Sector 44, Opposite HUDA City Centre",
    city: "Gurugram",
    state: "Haryana",
    postal_code: "122002",
    phone: "+91-124-496-2200",
    latitude: 28.4597,
    longitude: 77.072,
    rating: 4.6,
    review_count: 4120,
    type: "Multi-specialty",
    consultation_fee_min: 800,
    consultation_fee_max: 1500,
    specialties: ["Cardiac Surgery", "Oncology", "Orthopedics", "Neurosciences"],
    facilities: ["Emergency", "ICU", "Blood Bank", "Parking", "WiFi"],
    beds_total: 400,
    beds_available: 92,
    opening_hours: "24/7",
    image_url: "https://images.unsplash.com/photo-1584433144859-1fc3ab64a957?auto=format&fit=crop&w=900&q=80",
    source: "fallback"
  },
  {
    id: "fallback-aiims",
    name: "AIIMS New Delhi",
    address: "Sri Aurobindo Marg, Ansari Nagar",
    city: "New Delhi",
    state: "Delhi",
    postal_code: "110029",
    phone: "+91-11-2658-8500",
    latitude: 28.5672,
    longitude: 77.21,
    rating: 4.8,
    review_count: 9150,
    type: "Government",
    consultation_fee_min: 200,
    consultation_fee_max: 400,
    specialties: ["General Medicine", "Pediatrics", "Trauma Care", "Transplants"],
    facilities: ["Emergency", "ICU", "Blood Bank", "Lab", "Parking"],
    beds_total: 2400,
    beds_available: 320,
    opening_hours: "24/7",
    image_url: "https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?auto=format&fit=crop&w=900&q=80",
    source: "fallback"
  }
];

export const fetchNearbyHospitals = async ({
  latitude,
  longitude,
  maxDistanceKm = 15,
  minRating = 0,
  specialty,
  city,
  cities = [],
  limit = 30,
}) => {
  let query = supabaseAdmin
    .from(HOSPITALS_TABLE)
    .select(
      `id, name, address, city, state, postal_code, phone,
       latitude, longitude, rating, review_count, type,
       consultation_fee_min, consultation_fee_max,
       specialties, facilities,
       beds_total, beds_available,
       opening_hours, image_url,
       healthcare_speciality, healthcare, source`
    );

  const cityFilters = [];
  if (city) cityFilters.push(city);
  if (Array.isArray(cities)) {
    cities.forEach((entry) => {
      if (typeof entry === "string" && entry.trim().length > 0) {
        cityFilters.push(entry.trim());
      }
    });
  }

  if (cityFilters.length > 0) {
    const ors = [];
    cityFilters.forEach((candidate) => {
      const likeCity = `%${candidate}%`;
      ors.push(`city.ilike.${likeCity}`);
      ors.push(`addr_district_en.ilike.${likeCity}`);
      ors.push(`addr_block.ilike.${likeCity}`);
    });
    query = query.or(ors.join(","));
  } else {
    query = query.order("rating", { ascending: false });
  }

  let data = null;
  let error = null;

  try {
    const response = await query;
    data = response.data;
    error = response.error;
  } catch (fetchError) {
    console.error("Supabase fetch failed:", fetchError);
    error = fetchError;
  }

  if (error) {
    console.warn("Falling back to static hospital directory due to error:", error.message || error);
    const fallback = FALLBACK_HOSPITALS.map((hospital) => ({
      ...hospital,
      distance_km:
        typeof latitude === "number" && typeof longitude === "number"
          ? haversineDistanceKm(latitude, longitude, hospital.latitude, hospital.longitude)
          : null,
    })).filter((hospital) => {
      if (typeof latitude === "number" && typeof longitude === "number") {
        if (hospital.distance_km === null) return false;
        if (maxDistanceKm && hospital.distance_km > maxDistanceKm) return false;
      }
      if (specialty && specialty !== "all") {
        return hospital.specialties.some((s) =>
          s.toLowerCase().includes(String(specialty).toLowerCase())
        );
      }
      return true;
    });

    return fallback.slice(0, limit);
  }

  const results = (data || [])
    .map((hospital) => {
      const hasLatLng =
        typeof hospital.latitude === "number" && typeof hospital.longitude === "number";
      const hasUserCoordinates =
        typeof latitude === "number" && typeof longitude === "number";
      const distanceKm = hasLatLng && hasUserCoordinates
        ? haversineDistanceKm(latitude, longitude, hospital.latitude, hospital.longitude)
        : null;

      const specialtyList = parseList(hospital.specialties).concat(
        parseList(hospital.healthcare_speciality)
      );

      return {
        ...hospital,
        distance_km: distanceKm,
        specialties: specialtyList,
        facilities: parseList(hospital.facilities),
      };
    })
    .filter((hospital) => {
      if (typeof latitude === "number" && typeof longitude === "number") {
        if (hospital.distance_km === null) return false;
        if (maxDistanceKm && hospital.distance_km > maxDistanceKm) return false;
      }
      if (minRating && hospital.rating && hospital.rating < minRating) return false;
      if (specialty && specialty !== "all") {
        const match = hospital.specialties && hospital.specialties.length > 0
          ? hospital.specialties
          : parseList(hospital.healthcare_speciality);
        if (!match.some((s) => s.toLowerCase().includes(String(specialty).toLowerCase()))) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      if (typeof latitude === "number" && typeof longitude === "number") {
        return (a.distance_km ?? Number.MAX_VALUE) - (b.distance_km ?? Number.MAX_VALUE);
      }
      // For city-only queries, sort by rating then name
      if (a.rating && b.rating && a.rating !== b.rating) {
        return b.rating - a.rating;
      }
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);

  return results;
};

export const fetchHospitalDirectory = async ({ search, limit = 100 } = {}) => {
  let query = supabaseAdmin
    .from(HOSPITALS_TABLE)
    .select("id, name, city, state, address, postal_code, phone, type")
    .limit(limit)
    .order("name", { ascending: true });

  if (search) {
    const likeTerm = `%${search}%`;
    query = query.ilike("name", likeTerm);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message || "Failed to load hospital directory");
  }

  return data || [];
};
