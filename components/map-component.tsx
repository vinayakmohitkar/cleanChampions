"use client"

import { useEffect, useRef } from "react"

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
}

export default function MapComponent({
  center,
  collections,
  showAllCollections = false,
  onLocationSelect,
  highlightPostcode,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const initMap = async () => {
      try {
        const L = (await import("leaflet")).default

        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        })

        // Initialize map with proper center (Nottingham by default)
        const mapCenter =
          center.lat === 51.5074 && center.lng === -0.1278
            ? { lat: 52.9548, lng: -1.1581 } // Default to Nottingham instead of London
            : center

        const map = L.map(mapRef.current!).setView([mapCenter.lat, mapCenter.lng], 12)

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map)

        mapInstanceRef.current = map

        // Add postcode highlight if provided
        if (highlightPostcode) {
          // Find collections with this postcode to get the center
          const postcodeCollections = collections.filter((c) => c.postcode === highlightPostcode)

          if (postcodeCollections.length > 0) {
            // Calculate center of postcode collections
            const avgLat = postcodeCollections.reduce((sum, c) => sum + c.location_lat, 0) / postcodeCollections.length
            const avgLng = postcodeCollections.reduce((sum, c) => sum + c.location_lng, 0) / postcodeCollections.length

            // Create a circle to highlight the postcode area
            const circle = L.circle([avgLat, avgLng], {
              color: "#3b82f6",
              fillColor: "#3b82f6",
              fillOpacity: 0.15,
              weight: 3,
              radius: 800, // 800m radius
            }).addTo(map)

            circle.bindPopup(`
              <div style="text-align: center; padding: 8px; min-width: 150px;">
                <h4 style="margin: 0 0 4px 0; color: #1f2937; font-weight: 600;">${highlightPostcode}</h4>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">Highlighted Area</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #3b82f6;">
                  ${postcodeCollections.length} collection${postcodeCollections.length > 1 ? "s" : ""} here
                </p>
              </div>
            `)

            // Center map on this postcode area
            map.setView([avgLat, avgLng], 14)
          } else {
            // If no collections yet, just show a general area highlight
            const circle = L.circle([mapCenter.lat, mapCenter.lng], {
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.1,
              weight: 2,
              radius: 1000,
            }).addTo(map)

            circle.bindPopup(`
              <div style="text-align: center; padding: 8px;">
                <h4 style="margin: 0 0 4px 0; color: #1f2937; font-weight: 600;">${highlightPostcode}</h4>
                <p style="margin: 0; font-size: 12px; color: #6b7280;">Target Area</p>
              </div>
            `)
          }
        }

        // Add click handler if onLocationSelect is provided
        if (onLocationSelect) {
          map.on("click", (e: any) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng)
          })
        }

        // Add collection markers
        collections.forEach((collection) => {
          const isHighlighted = highlightPostcode && collection.postcode === highlightPostcode

          const icon = L.divIcon({
            html: `<div style="
              width: ${isHighlighted ? "32px" : "28px"}; 
              height: ${isHighlighted ? "32px" : "28px"}; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              color: white; 
              font-size: ${isHighlighted ? "14px" : "12px"}; 
              font-weight: bold; 
              border: ${isHighlighted ? "4px solid #fbbf24" : "2px solid white"};
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ${collection.collected ? "background-color: #10b981;" : "background-color: #ef4444;"}
              ${isHighlighted ? "transform: scale(1.1); z-index: 1000;" : ""}
            ">${collection.bag_count}</div>`,
            className: "custom-div-icon",
            iconSize: [isHighlighted ? 32 : 28, isHighlighted ? 32 : 28],
            iconAnchor: [isHighlighted ? 16 : 14, isHighlighted ? 16 : 14],
          })

          const marker = L.marker([collection.location_lat, collection.location_lng], { icon }).addTo(map)

          marker.bindPopup(`
            <div style="padding: 12px; min-width: 220px;">
              <h3 style="font-weight: 600; margin-bottom: 8px; color: #1f2937; font-size: 16px;">
                ${collection.location_name}
              </h3>
              ${
                collection.postcode
                  ? `
                <div style="margin-bottom: 8px;">
                  <span style="
                    background-color: #3b82f6; 
                    color: white; 
                    padding: 2px 8px; 
                    border-radius: 12px; 
                    font-size: 12px; 
                    font-weight: 500;
                  ">${collection.postcode}</span>
                </div>
              `
                  : ""
              }
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 8px; line-height: 1.4;">
                ${collection.area_cleaned}
              </p>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <p style="font-size: 14px; margin: 0; font-weight: 500;">
                  <strong>${collection.bag_count}</strong> bag${collection.bag_count > 1 ? "s" : ""}
                </p>
                <p style="font-size: 12px; color: #9ca3af; margin: 0;">
                  ${new Date(collection.created_at).toLocaleDateString()}
                </p>
              </div>
              <div style="text-align: center;">
                <span style="
                  display: inline-block; 
                  padding: 6px 12px; 
                  font-size: 12px; 
                  border-radius: 6px; 
                  font-weight: 500;
                  ${
                    collection.collected
                      ? "background-color: #d1fae5; color: #065f46; border: 1px solid #10b981;"
                      : "background-color: #fee2e2; color: #991b1b; border: 1px solid #ef4444;"
                  }
                ">
                  ${collection.collected ? "✅ Collected" : "⏳ Pending Collection"}
                </span>
              </div>
            </div>
          `)
        })

        // If we have collections, fit the map to show all of them
        if (collections.length > 0 && !highlightPostcode) {
          const group = new L.featureGroup(collections.map((c) => L.marker([c.location_lat, c.location_lng])))
          map.fitBounds(group.getBounds().pad(0.1))
        }
      } catch (error) {
        console.error("Error loading map:", error)
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f3f4f6; border-radius: 8px; border: 2px dashed #d1d5db;">
              <div style="text-align: center; color: #6b7280; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
                <p style="font-weight: 500; margin-bottom: 8px;">Map loading...</p>
                <p style="font-size: 12px;">If this persists, there may be a network issue.</p>
              </div>
            </div>
          `
        }
      }
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
      }
    }
  }, [center, collections, onLocationSelect, highlightPostcode])

  return <div ref={mapRef} className="w-full h-full" style={{ minHeight: "300px" }} />
}
