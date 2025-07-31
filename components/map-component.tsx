"use client"

import { useEffect, useRef, useState } from "react"
import "leaflet/dist/leaflet.css"

type Collection = {
  id: string
  location_lat: number
  location_lng: number
  location_name: string
  postcode?: string
  bag_count: number
  area_cleaned: string
  collected: boolean
  created_at: string
}

interface MapComponentProps {
  center: { lat: number; lng: number }
  collections: Collection[]
  showAllCollections?: boolean
  onLocationSelect?: (lat: number, lng: number) => void
  highlightPostcode?: string
  className?: string
}

export default function MapComponent({
  center,
  collections,
  showAllCollections = false,
  onLocationSelect,
  highlightPostcode,
  className = "",
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const initMap = async () => {
      if (!mapRef.current) return

      try {
        setIsLoading(true)
        setError(null)

        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
          mapInstanceRef.current = null
        }

        // Wait a bit for cleanup
        await new Promise((resolve) => setTimeout(resolve, 100))

        if (!isMounted) return

        // Import Leaflet dynamically
        const L = (await import("leaflet")).default

        // Fix marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        })

        // Use Nottingham as default center
        const mapCenter = center.lat === 51.5074 && center.lng === -0.1278 ? { lat: 52.9548, lng: -1.1581 } : center

        // Create map
        const map = L.map(mapRef.current, {
          center: [mapCenter.lat, mapCenter.lng],
          zoom: 12,
          scrollWheelZoom: true,
          zoomControl: true,
        })

        if (!isMounted) {
          map.remove()
          return
        }

        // Add tile layer
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 18,
        }).addTo(map)

        mapInstanceRef.current = map

        // Add click handler
        if (onLocationSelect) {
          map.on("click", (e: any) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng)
          })
        }

        // Add postcode highlight
        if (highlightPostcode && collections.length > 0) {
          const postcodeCollections = collections.filter((c) => c.postcode === highlightPostcode)

          if (postcodeCollections.length > 0) {
            const avgLat = postcodeCollections.reduce((sum, c) => sum + c.location_lat, 0) / postcodeCollections.length
            const avgLng = postcodeCollections.reduce((sum, c) => sum + c.location_lng, 0) / postcodeCollections.length

            L.circle([avgLat, avgLng], {
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.15,
              weight: 3,
              radius: 800,
            })
              .addTo(map)
              .bindPopup(`
              <div style="text-align: center; padding: 8px;">
                <h4 style="margin: 0 0 4px 0;">${highlightPostcode}</h4>
                <p style="margin: 0; font-size: 12px;">Highlighted Area</p>
              </div>
            `)

            map.setView([avgLat, avgLng], 14)
          }
        }

        // Add collection markers
        collections.forEach((collection) => {
          const isHighlighted = highlightPostcode && collection.postcode === highlightPostcode

          // Create simple colored marker
          const markerColor = collection.collected ? "#10b981" : "#ef4444"
          const markerSize = isHighlighted ? 32 : 24

          const icon = L.divIcon({
            html: `
              <div style="
                width: ${markerSize}px; 
                height: ${markerSize}px; 
                border-radius: 50%; 
                background-color: ${markerColor};
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: ${markerSize > 24 ? "12px" : "10px"};
              ">
                ${collection.bag_count}
              </div>
            `,
            className: "custom-marker",
            iconSize: [markerSize, markerSize],
            iconAnchor: [markerSize / 2, markerSize / 2],
          })

          const marker = L.marker([collection.location_lat, collection.location_lng], { icon })

          marker.bindPopup(`
            <div style="padding: 8px; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
                ${collection.location_name}
              </h3>
              ${collection.postcode ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${collection.postcode}</p>` : ""}
              <p style="margin: 0 0 4px 0; font-size: 12px;">${collection.area_cleaned}</p>
              <p style="margin: 0 0 4px 0; font-size: 12px;">
                <strong>${collection.bag_count}</strong> bag${collection.bag_count > 1 ? "s" : ""}
              </p>
              <p style="margin: 0; font-size: 11px; color: #999;">
                ${new Date(collection.created_at).toLocaleDateString()}
              </p>
              <div style="margin-top: 8px; text-align: center;">
                <span style="
                  padding: 4px 8px; 
                  border-radius: 4px; 
                  font-size: 11px; 
                  color: white;
                  background-color: ${collection.collected ? "#10b981" : "#ef4444"};
                ">
                  ${collection.collected ? "✅ Collected" : "⏳ Pending"}
                </span>
              </div>
            </div>
          `)

          marker.addTo(map)
        })

        // Fit bounds if we have collections
        if (collections.length > 0 && !highlightPostcode) {
          const group = new L.featureGroup(collections.map((c) => L.marker([c.location_lat, c.location_lng])))
          map.fitBounds(group.getBounds().pad(0.1))
        }

        setIsLoading(false)
      } catch (error) {
        console.error("Map initialization error:", error)
        setError("Failed to load map")
        setIsLoading(false)
      }
    }

    initMap()

    return () => {
      isMounted = false
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove()
        } catch (e) {
          console.log("Error cleaning up map:", e)
        }
        mapInstanceRef.current = null
      }
    }
  }, [center, collections, onLocationSelect, highlightPostcode])

  if (error) {
    return (
      <div
        className={`w-full h-full min-h-[300px] flex items-center justify-center bg-gray-100 rounded-lg border ${className}`}
      >
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🗺️</div>
          <p className="text-gray-600 font-medium mb-2">Map Error</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        className={`w-full h-full min-h-[300px] flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={mapRef}
      className={`w-full h-full min-h-[300px] rounded-lg ${className}`}
      style={{ minHeight: "300px" }}
    />
  )
}
