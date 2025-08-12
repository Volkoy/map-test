import type { LngLatLike } from "maplibre-gl";
import { middleOfUSA } from "./constants";

export interface LocationResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
}

export async function getLocation(): Promise<LngLatLike> {
  // Try browser geolocation first (more accurate and no CORS issues)
  if (navigator.geolocation) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 10000,
          enableHighAccuracy: true,
          maximumAge: 300000 // 5 minutes
        });
      });
      
      const { latitude, longitude } = position.coords;
      console.log("Browser geolocation found - lat:", latitude, "lon:", longitude);
      return [longitude, latitude] as LngLatLike;
    } catch (error) {
      console.warn("Browser geolocation failed:", error);
    }
  }
  console.log("Using fallback location:", middleOfUSA);
  return middleOfUSA;
}