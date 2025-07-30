export interface PostcodeResult {
  latitude: number
  longitude: number
  postcode: string
  district: string
  ward: string
  country: string
}

export class PostcodeService {
  // Using free UK postcode API
  static async geocodePostcode(postcode: string): Promise<PostcodeResult | null> {
    try {
      const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase()

      // Try postcodes.io first (free UK postcode API)
      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`)

      if (response.ok) {
        const data = await response.json()
        if (data.status === 200 && data.result) {
          return {
            latitude: data.result.latitude,
            longitude: data.result.longitude,
            postcode: data.result.postcode,
            district: data.result.admin_district,
            ward: data.result.admin_ward,
            country: data.result.country,
          }
        }
      }

      // Fallback: try to extract area from postcode for approximate location
      const postcodeArea = cleanPostcode.substring(0, 2)
      const approximateLocations: { [key: string]: { lat: number; lng: number } } = {
        SW: { lat: 51.4875, lng: -0.1687 }, // Southwest London
        SE: { lat: 51.4769, lng: -0.0005 }, // Southeast London
        NW: { lat: 51.5441, lng: -0.202 }, // Northwest London
        NE: { lat: 54.9783, lng: -1.6178 }, // Northeast England
        E1: { lat: 51.5154, lng: -0.0649 }, // East London
        W1: { lat: 51.5154, lng: -0.1553 }, // West London
        N1: { lat: 51.5387, lng: -0.1077 }, // North London
        M1: { lat: 53.4808, lng: -2.2426 }, // Manchester
        B1: { lat: 52.4862, lng: -1.8904 }, // Birmingham
        L1: { lat: 53.4084, lng: -2.9916 }, // Liverpool
      }

      const approxLocation = approximateLocations[postcodeArea]
      if (approxLocation) {
        return {
          latitude: approxLocation.lat,
          longitude: approxLocation.lng,
          postcode: cleanPostcode,
          district: "Unknown",
          ward: "Unknown",
          country: "England",
        }
      }

      return null
    } catch (error) {
      console.error("Error geocoding postcode:", error)
      return null
    }
  }

  static validatePostcode(postcode: string): boolean {
    // UK postcode regex
    const postcodeRegex = /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i
    return postcodeRegex.test(postcode.replace(/\s+/g, ""))
  }
}
