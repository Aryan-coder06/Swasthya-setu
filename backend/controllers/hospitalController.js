import { fetchNearbyHospitals, fetchHospitalDirectory } from "../models/hospitals.js";

const getNearbyHospitals = async (req, res) => {
  try {
    const { latitude, longitude, maxDistanceKm, minRating, specialty, city, cities, limit } = req.body;

    if ((latitude === undefined || longitude === undefined) && !city) {
      return res.status(400).json({ error: "Provide either latitude & longitude or a city parameter" });
    }

    const hasCoordinates = typeof latitude === "number" && typeof longitude === "number";
    if (!hasCoordinates && city) {
      // coordinates are optional, but when supplied they must be numbers
    } else if (!hasCoordinates) {
      return res.status(400).json({ error: "latitude and longitude must be numeric" });
    }

    const cityFilters = [];
    if (typeof city === "string" && city.trim().length > 0) {
      cityFilters.push(city.trim());
    }
    if (Array.isArray(cities)) {
      cities.forEach((item) => {
        if (typeof item === "string" && item.trim().length > 0) {
          cityFilters.push(item.trim());
        }
      });
    }

    const hospitals = await fetchNearbyHospitals({
      latitude: hasCoordinates ? latitude : undefined,
      longitude: hasCoordinates ? longitude : undefined,
      maxDistanceKm: typeof maxDistanceKm === "number" ? maxDistanceKm : undefined,
      minRating: typeof minRating === "number" ? minRating : undefined,
      specialty: typeof specialty === "string" && specialty !== "all" ? specialty : undefined,
      city: cityFilters[0],
      cities: cityFilters.slice(1),
      limit: typeof limit === "number" ? limit : undefined,
    });

    return res.status(200).json({ data: hospitals });
  } catch (error) {
    console.error("Error fetching nearby hospitals:", error);
    return res.status(500).json({ error: error?.message || "Failed to fetch nearby hospitals" });
  }
};

const listHospitalsDirectory = async (req, res) => {
  try {
    const { search, limit } = req.query ?? {};
    const hospitals = await fetchHospitalDirectory({
      search: typeof search === "string" ? search.trim() : undefined,
      limit: limit ? Number(limit) : undefined,
    });
    return res.status(200).json({ data: hospitals });
  } catch (error) {
    console.error("Error listing hospitals:", error);
    return res.status(500).json({ error: error?.message || "Failed to load hospitals" });
  }
};

export { getNearbyHospitals, listHospitalsDirectory };
