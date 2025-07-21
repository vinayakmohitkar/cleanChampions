"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

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
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView([center.lat, center.lng], 13)

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map)

    mapInstanceRef.current = map

    // Add click handler if onLocationSelect is provided
    if (onLocationSelect) {
      map.on("click", (e) => {
        onLocationSelect(e.latlng.lat, e.latlng.lng)
      })
    }

    return () => {
      map.remove()
    }
  }, [center.lat, center.lng, onLocationSelect])

  useEffect(() => {
    if (!mapInstanceRef.current) return

    // Clear existing markers
    mapInstanceRef.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        mapInstanceRef.current!.removeLayer(layer)
      }
    })

    // Add collection markers
    collections.forEach((collection) => {
      const icon = L.divIcon({
        html: `<div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
          collection.collected ? "bg-green-500" : "bg-red-500"
        }">${collection.bag_count}</div>`,
        className: "custom-div-icon",
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })

      const marker = L.marker([collection.location_lat, collection.location_lng], { icon }).addTo(
        mapInstanceRef.current!,
      )

      marker.bindPopup(`
        <div class="p-2">
          <h3 class="font-semibold">${collection.location_name}</h3>
          <p class="text-sm text-gray-600">${collection.area_cleaned}</p>
          <p class="text-sm">
            <strong>${collection.bag_count}</strong> bag${collection.bag_count > 1 ? "s" : ""}
          </p>
          <p class="text-xs text-gray-500">
            ${new Date(collection.created_at).toLocaleDateString()}
          </p>
          <span class="inline-block px-2 py-1 text-xs rounded ${
            collection.collected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }">
            ${collection.collected ? "Collected" : "Pending Collection"}
          </span>
        </div>
      `)
    })
  }, [collections])

  return <div ref={mapRef} className="w-full h-full" />
}
