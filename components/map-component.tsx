"use client"

import { useEffect, useRef } from "react"

type Collection = {
  id: string
  location_lat: number
  location_lng: number
  location_name: string
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
}

export default function MapComponent({
  center,
  collections,
  showAllCollections = false,
  onLocationSelect,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Dynamically import Leaflet to avoid SSR issues
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

        // Initialize map
        const map = L.map(mapRef.current!).setView([center.lat, center.lng], 13)

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
        }).addTo(map)

        mapInstanceRef.current = map

        // Add click handler if onLocationSelect is provided
        if (onLocationSelect) {
          map.on("click", (e: any) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng)
          })
        }

        // Add collection markers
        collections.forEach((collection) => {
          const icon = L.divIcon({
            html: `<div style="width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold; ${
              collection.collected ? "background-color: #10b981;" : "background-color: #ef4444;"
            }">${collection.bag_count}</div>`,
            className: "custom-div-icon",
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          const marker = L.marker([collection.location_lat, collection.location_lng], { icon }).addTo(map)

          marker.bindPopup(`
            <div style="padding: 8px;">
              <h3 style="font-weight: 600; margin-bottom: 4px;">${collection.location_name}</h3>
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">${collection.area_cleaned}</p>
              <p style="font-size: 14px; margin-bottom: 4px;">
                <strong>${collection.bag_count}</strong> bag${collection.bag_count > 1 ? "s" : ""}
              </p>
              <p style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">
                ${new Date(collection.created_at).toLocaleDateString()}
              </p>
              <span style="display: inline-block; padding: 2px 8px; font-size: 12px; border-radius: 4px; ${
                collection.collected
                  ? "background-color: #d1fae5; color: #065f46;"
                  : "background-color: #fee2e2; color: #991b1b;"
              }">
                ${collection.collected ? "Collected" : "Pending Collection"}
              </span>
            </div>
          `)
        })
      } catch (error) {
        console.error("Error loading map:", error)
        // Show fallback message
        if (mapRef.current) {
          mapRef.current.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f3f4f6; border-radius: 8px;">
              <div style="text-align: center; color: #6b7280;">
                <p>Map loading...</p>
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
  }, [center.lat, center.lng, collections, onLocationSelect])

  return <div ref={mapRef} className="w-full h-full" style={{ minHeight: "300px" }} />
}
