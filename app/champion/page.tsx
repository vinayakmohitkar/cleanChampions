"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { PostcodeService } from "@/lib/postcode-service"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Trash2, Package, Plus, LogOut, Clock, Award } from "lucide-react"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
  ),
})

type BagCollection = {
  id: string
  location_lat: number
  location_lng: number
  location_name: string
  postcode?: string
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
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const [collections, setCollections] = useState<BagCollection[]>([])
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  const [newCollection, setNewCollection] = useState({
    postcode: "",
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
    if (user && profile) {
      fetchCollections()
      fetchSupplyRequests()
      getCurrentLocation()
    }
  }, [user, profile])

  useEffect(() => {
    if (!authLoading) {
      if (!user || !profile) {
        console.log("No user or profile, redirecting to home")
        window.location.href = "/"
        return
      }
      if (profile.user_type !== "champion") {
        console.log(`User type ${profile.user_type} not allowed on champion page, redirecting`)
        // Redirect to correct dashboard
        switch (profile.user_type) {
          case "worker":
            window.location.href = "/worker"
            break
          case "admin":
            window.location.href = "/admin"
            break
          default:
            window.location.href = "/"
        }
        return
      }
    }
  }, [user, profile, authLoading])

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
          // Default to Nottingham coordinates instead of London
          setCurrentLocation({ lat: 52.9548, lng: -1.1581 })
        },
      )
    } else {
      // Default to Nottingham coordinates
      setCurrentLocation({ lat: 52.9548, lng: -1.1581 })
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

    if (!PostcodeService.validatePostcode(newCollection.postcode)) {
      alert("Please enter a valid UK postcode (e.g., NG1 5DT)")
      return
    }

    try {
      // Geocode the postcode
      const postcodeResult = await PostcodeService.geocodePostcode(newCollection.postcode)

      if (!postcodeResult) {
        alert("Could not find location for this postcode. Please check and try again.")
        return
      }

      const { error } = await supabase.from("bag_collections").insert({
        champion_id: user!.id,
        location_lat: postcodeResult.latitude,
        location_lng: postcodeResult.longitude,
        location_name: newCollection.location_name,
        postcode: postcodeResult.postcode,
        bag_count: newCollection.bag_count,
        area_cleaned: newCollection.area_cleaned,
        notes: newCollection.notes || null,
      })

      if (error) throw error

      // Update current location to the new postcode location
      setCurrentLocation({
        lat: postcodeResult.latitude,
        lng: postcodeResult.longitude,
      })

      setNewCollection({
        postcode: "",
        location_name: "",
        bag_count: 1,
        area_cleaned: "",
        notes: "",
      })
      setShowAddForm(false)
      fetchCollections()
      alert(`Collection logged successfully in ${postcodeResult.district}!`)
    } catch (error) {
      console.error("Error adding collection:", error)
      alert("Error logging collection. Please try again.")
    }
  }

  const handleSupplyRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { error } = await supabase.from("supply_requests").insert({
        champion_id: user!.id,
        request_type: newSupplyRequest.request_type,
        quantity: newSupplyRequest.quantity,
        notes: newSupplyRequest.notes || null,
      })

      if (error) throw error

      setNewSupplyRequest({
        request_type: "bags",
        quantity: 1,
        notes: "",
      })
      fetchSupplyRequests()
      alert("Supply request submitted successfully!")
    } catch (error) {
      console.error("Error requesting supplies:", error)
      alert("Error submitting supply request. Please try again.")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-green-800">Loading your Champion dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in to access the champion dashboard.</p>
          <a href="/" className="text-blue-600 hover:underline">
            Go to Home
          </a>
        </div>
      </div>
    )
  }

  const totalBags = collections.reduce((sum, collection) => sum + collection.bag_count, 0)
  const collectedBags = collections
    .filter((c) => c.collected)
    .reduce((sum, collection) => sum + collection.bag_count, 0)

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-600 p-2 rounded-lg">
                <Award className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-green-900">Clean Champion Dashboard</h1>
                <p className="text-green-700">Welcome back, {profile?.full_name}! 🌟</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-green-600">
                <Clock className="h-4 w-4 inline mr-1" />
                Session expires in 15 min
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                className="border-green-300 text-green-700 hover:bg-green-100 bg-transparent"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Total Bags Logged</CardTitle>
              <Trash2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{totalBags}</div>
              <p className="text-xs text-green-600 mt-1">Keep up the great work! 🎯</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Bags Collected</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{collectedBags}</div>
              <p className="text-xs text-blue-600 mt-1">Council collected ✅</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Areas Cleaned</CardTitle>
              <MapPin className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{collections.length}</div>
              <p className="text-xs text-purple-600 mt-1">Making a difference! 🌍</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="log" className="space-y-6">
          <TabsList className="bg-green-100 border-green-200">
            <TabsTrigger value="log" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Log Collection
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              History
            </TabsTrigger>
            <TabsTrigger value="supplies" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Request Supplies
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
              Community Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-900">Log New Collection</CardTitle>
                <CardDescription className="text-green-700">
                  Record the bags you've collected with postcode location
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {!showAddForm ? (
                  <Button onClick={() => setShowAddForm(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Collection
                  </Button>
                ) : (
                  <form onSubmit={handleAddCollection} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="postcode" className="text-green-800">
                          Postcode *
                        </Label>
                        <Input
                          id="postcode"
                          placeholder="e.g., SW1A 1AA"
                          value={newCollection.postcode}
                          onChange={(e) =>
                            setNewCollection({ ...newCollection, postcode: e.target.value.toUpperCase() })
                          }
                          className="border-green-300 focus:border-green-500"
                          required
                        />
                        <p className="text-xs text-green-600 mt-1">UK postcode for precise location</p>
                      </div>
                      <div>
                        <Label htmlFor="location_name" className="text-green-800">
                          Location Name *
                        </Label>
                        <Input
                          id="location_name"
                          placeholder="e.g., High Street, Park entrance"
                          value={newCollection.location_name}
                          onChange={(e) => setNewCollection({ ...newCollection, location_name: e.target.value })}
                          className="border-green-300 focus:border-green-500"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bag_count" className="text-green-800">
                          Number of Bags *
                        </Label>
                        <Input
                          id="bag_count"
                          type="number"
                          min="1"
                          value={newCollection.bag_count}
                          onChange={(e) =>
                            setNewCollection({ ...newCollection, bag_count: Number.parseInt(e.target.value) })
                          }
                          className="border-green-300 focus:border-green-500"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="area_cleaned" className="text-green-800">
                          Area Cleaned *
                        </Label>
                        <Input
                          id="area_cleaned"
                          placeholder="Describe the area you cleaned"
                          value={newCollection.area_cleaned}
                          onChange={(e) => setNewCollection({ ...newCollection, area_cleaned: e.target.value })}
                          className="border-green-300 focus:border-green-500"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes" className="text-green-800">
                        Notes (Optional)
                      </Label>
                      <Textarea
                        id="notes"
                        placeholder="Any additional notes about the collection"
                        value={newCollection.notes}
                        onChange={(e) => setNewCollection({ ...newCollection, notes: e.target.value })}
                        className="border-green-300 focus:border-green-500"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">
                        Save Collection
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAddForm(false)}
                        className="border-green-300 text-green-700 hover:bg-green-100"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-900">Collection History</CardTitle>
                <CardDescription className="text-green-700">Your past bag collections and their status</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {collections.map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-900">{collection.location_name}</span>
                          {collection.postcode && (
                            <Badge variant="outline" className="border-green-300 text-green-700">
                              {collection.postcode}
                            </Badge>
                          )}
                          <Badge
                            variant={collection.collected ? "default" : "secondary"}
                            className={collection.collected ? "bg-green-600" : "bg-yellow-500"}
                          >
                            {collection.collected ? "Collected" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-green-700">{collection.area_cleaned}</p>
                        <p className="text-sm text-green-600">
                          {collection.bag_count} bag{collection.bag_count > 1 ? "s" : ""} •{" "}
                          {new Date(collection.created_at).toLocaleDateString()}
                        </p>
                        {collection.notes && <p className="text-sm text-green-600 mt-1">Note: {collection.notes}</p>}
                      </div>
                    </div>
                  ))}
                  {collections.length === 0 && (
                    <div className="text-center py-8 text-green-600">
                      <Award className="h-12 w-12 mx-auto mb-4 text-green-400" />
                      <p>No collections logged yet. Start by adding your first collection!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supplies" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-900">Request Supplies</CardTitle>
                  <CardDescription className="text-green-700">
                    Request more bags or gloves for your cleaning efforts
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSupplyRequest} className="space-y-4">
                    <div>
                      <Label htmlFor="request_type" className="text-green-800">
                        Supply Type
                      </Label>
                      <select
                        id="request_type"
                        className="w-full p-2 border border-green-300 rounded-md focus:border-green-500"
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
                      <Label htmlFor="quantity" className="text-green-800">
                        Quantity
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={newSupplyRequest.quantity}
                        onChange={(e) =>
                          setNewSupplyRequest({ ...newSupplyRequest, quantity: Number.parseInt(e.target.value) })
                        }
                        className="border-green-300 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="supply_notes" className="text-green-800">
                        Notes (Optional)
                      </Label>
                      <Textarea
                        id="supply_notes"
                        placeholder="Any specific requirements or delivery instructions"
                        value={newSupplyRequest.notes}
                        onChange={(e) => setNewSupplyRequest({ ...newSupplyRequest, notes: e.target.value })}
                        className="border-green-300 focus:border-green-500"
                      />
                    </div>
                    <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                      Request Supplies
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-green-200">
                <CardHeader className="bg-green-50">
                  <CardTitle className="text-green-900">Supply Requests</CardTitle>
                  <CardDescription className="text-green-700">Track your supply request status</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {supplyRequests.map((request) => (
                      <div key={request.id} className="p-3 border border-green-200 rounded-lg bg-green-50">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium capitalize text-green-900">{request.request_type}</span>
                          <Badge
                            variant={
                              request.status === "delivered"
                                ? "default"
                                : request.status === "approved"
                                  ? "secondary"
                                  : "outline"
                            }
                            className={
                              request.status === "delivered"
                                ? "bg-green-600"
                                : request.status === "approved"
                                  ? "bg-blue-500"
                                  : "border-yellow-400 text-yellow-700"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-green-700">Quantity: {request.quantity}</p>
                        <p className="text-sm text-green-600">{new Date(request.created_at).toLocaleDateString()}</p>
                        {request.notes && <p className="text-sm text-green-600 mt-1">Note: {request.notes}</p>}
                      </div>
                    ))}
                    {supplyRequests.length === 0 && (
                      <p className="text-center text-green-600 py-4">No supply requests yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="map" className="space-y-6">
            <Card className="border-green-200">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-900">Community Activity Map</CardTitle>
                <CardDescription className="text-green-700">
                  See where you and other Clean Champions have been active
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-96 rounded-lg overflow-hidden border border-green-200">
                  {currentLocation && (
                    <MapComponent
                      center={currentLocation}
                      collections={collections}
                      showAllCollections={true}
                      highlightPostcode={collections.length > 0 ? collections[0].postcode : undefined}
                    />
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
