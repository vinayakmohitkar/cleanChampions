"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Trash2, Package, Plus, LogOut } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import("@/components/map-component"), { ssr: false })

type BagCollection = {
  id: string
  location_lat: number
  location_lng: number
  location_name: string
  bag_count: number
  area_cleaned: string
  notes: string | null
  collected: boolean
  collected_at: string | null
  created_at: string
}

type SupplyRequest = {
  id: string
  request_type: "bags" | "gloves" | "both"
  quantity: number
  notes: string | null
  status: "pending" | "approved" | "delivered"
  created_at: string
}

export default function ChampionDashboard() {
  const { user, profile, signOut } = useAuth()
  const [collections, setCollections] = useState<BagCollection[]>([])
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  const [newCollection, setNewCollection] = useState({
    location_name: "",
    bag_count: 1,
    area_cleaned: "",
    notes: "",
  })

  const [newSupplyRequest, setNewSupplyRequest] = useState({
    request_type: "bags" as "bags" | "gloves" | "both",
    quantity: 1,
    notes: "",
  })

  useEffect(() => {
    if (user) {
      fetchCollections()
      fetchSupplyRequests()
      getCurrentLocation()
    }
  }, [user])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          // Default to a central location if geolocation fails
          setCurrentLocation({ lat: 51.5074, lng: -0.1278 }) // London
        },
      )
    }
  }

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("bag_collections")
        .select("*")
        .eq("champion_id", user!.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCollections(data || [])
    } catch (error) {
      console.error("Error fetching collections:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSupplyRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("supply_requests")
        .select("*")
        .eq("champion_id", user!.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSupplyRequests(data || [])
    } catch (error) {
      console.error("Error fetching supply requests:", error)
    }
  }

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentLocation) return

    try {
      const { error } = await supabase.from("bag_collections").insert({
        champion_id: user!.id,
        location_lat: currentLocation.lat,
        location_lng: currentLocation.lng,
        location_name: newCollection.location_name,
        bag_count: newCollection.bag_count,
        area_cleaned: newCollection.area_cleaned,
        notes: newCollection.notes,
      })

      if (error) throw error

      setNewCollection({
        location_name: "",
        bag_count: 1,
        area_cleaned: "",
        notes: "",
      })
      setShowAddForm(false)
      fetchCollections()
    } catch (error) {
      console.error("Error adding collection:", error)
    }
  }

  const handleSupplyRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from("supply_requests").insert({
        champion_id: user!.id,
        request_type: newSupplyRequest.request_type,
        quantity: newSupplyRequest.quantity,
        notes: newSupplyRequest.notes,
      })

      if (error) throw error

      setNewSupplyRequest({
        request_type: "bags",
        quantity: 1,
        notes: "",
      })
      fetchSupplyRequests()
    } catch (error) {
      console.error("Error requesting supplies:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  const totalBags = collections.reduce((sum, collection) => sum + collection.bag_count, 0)
  const collectedBags = collections
    .filter((c) => c.collected)
    .reduce((sum, collection) => sum + collection.bag_count, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clean Champion Dashboard</h1>
              <p className="text-gray-600">Welcome back, {profile?.full_name}!</p>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bags Logged</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalBags}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bags Collected</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{collectedBags}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Areas Cleaned</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{collections.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="log" className="space-y-6">
          <TabsList>
            <TabsTrigger value="log">Log Collection</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="supplies">Request Supplies</TabsTrigger>
            <TabsTrigger value="map">Community Map</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Log New Collection</CardTitle>
                <CardDescription>Record the bags you've collected and their location</CardDescription>
              </CardHeader>
              <CardContent>
                {!showAddForm ? (
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Collection
                  </Button>
                ) : (
                  <form onSubmit={handleAddCollection} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location_name">Location Name</Label>
                        <Input
                          id="location_name"
                          placeholder="e.g., High Street, Park entrance"
                          value={newCollection.location_name}
                          onChange={(e) => setNewCollection({ ...newCollection, location_name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="bag_count">Number of Bags</Label>
                        <Input
                          id="bag_count"
                          type="number"
                          min="1"
                          value={newCollection.bag_count}
                          onChange={(e) =>
                            setNewCollection({ ...newCollection, bag_count: Number.parseInt(e.target.value) })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="area_cleaned">Area Cleaned</Label>
                      <Input
                        id="area_cleaned"
                        placeholder="Describe the area you cleaned"
                        value={newCollection.area_cleaned}
                        onChange={(e) => setNewCollection({ ...newCollection, area_cleaned: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional notes about the collection"
                        value={newCollection.notes}
                        onChange={(e) => setNewCollection({ ...newCollection, notes: e.target.value })}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit">Save Collection</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Collection History</CardTitle>
                <CardDescription>Your past bag collections and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {collections.map((collection) => (
                    <div key={collection.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{collection.location_name}</span>
                          <Badge variant={collection.collected ? "default" : "secondary"}>
                            {collection.collected ? "Collected" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{collection.area_cleaned}</p>
                        <p className="text-sm text-gray-500">
                          {collection.bag_count} bag{collection.bag_count > 1 ? "s" : ""} •{" "}
                          {new Date(collection.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {collections.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      No collections logged yet. Start by adding your first collection!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supplies" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Request Supplies</CardTitle>
                  <CardDescription>Request more bags or gloves for your cleaning efforts</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSupplyRequest} className="space-y-4">
                    <div>
                      <Label htmlFor="request_type">Supply Type</Label>
                      <select
                        id="request_type"
                        className="w-full p-2 border rounded-md"
                        value={newSupplyRequest.request_type}
                        onChange={(e) =>
                          setNewSupplyRequest({ ...newSupplyRequest, request_type: e.target.value as any })
                        }
                      >
                        <option value="bags">Purple Bags</option>
                        <option value="gloves">Gloves</option>
                        <option value="both">Both Bags & Gloves</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newSupplyRequest.quantity}
                        onChange={(e) =>
                          setNewSupplyRequest({ ...newSupplyRequest, quantity: Number.parseInt(e.target.value) })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="supply_notes">Notes (Optional)</Label>
                      <Textarea
                        id="supply_notes"
                        placeholder="Any specific requirements or delivery instructions"
                        value={newSupplyRequest.notes}
                        onChange={(e) => setNewSupplyRequest({ ...newSupplyRequest, notes: e.target.value })}
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Request Supplies
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Supply Requests</CardTitle>
                  <CardDescription>Track your supply request status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {supplyRequests.map((request) => (
                      <div key={request.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize">{request.request_type}</span>
                          <Badge
                            variant={
                              request.status === "delivered"
                                ? "default"
                                : request.status === "approved"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Quantity: {request.quantity}</p>
                        <p className="text-sm text-gray-500">{new Date(request.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {supplyRequests.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No supply requests yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Community Activity Map</CardTitle>
                <CardDescription>See where other Clean Champions have been active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden">
                  {currentLocation && (
                    <MapComponent center={currentLocation} collections={collections} showAllCollections={true} />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
