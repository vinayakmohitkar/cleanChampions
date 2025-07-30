"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Trash2, CheckCircle, Clock, LogOut, Truck, Navigation } from "lucide-react"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">Loading map...</div>
  ),
})

type BagCollection = {
  id: string
  champion_id: string
  location_lat: number
  location_lng: number
  location_name: string
  postcode?: string
  bag_count: number
  area_cleaned: string
  notes: string | null
  collected: boolean
  collected_by: string | null
  collected_at: string | null
  created_at: string
  profiles: {
    full_name: string
    phone: string | null
  }
}

export default function WorkerDashboard() {
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const [collections, setCollections] = useState<BagCollection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && profile) {
      fetchCollections()
    }
  }, [user, profile])

  useEffect(() => {
    if (!authLoading) {
      if (!user || !profile) {
        console.log("No user or profile, redirecting to home")
        window.location.href = "/"
        return
      }
      if (profile.user_type !== "worker") {
        console.log(`User type ${profile.user_type} not allowed on worker page, redirecting`)
        // Redirect to correct dashboard
        switch (profile.user_type) {
          case "champion":
            window.location.href = "/champion"
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

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("bag_collections")
        .select(`
          *,
          profiles:champion_id (
            full_name,
            phone
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCollections(data || [])
    } catch (error) {
      console.error("Error fetching collections:", error)
    } finally {
      setLoading(false)
    }
  }

  const markAsCollected = async (collectionId: string) => {
    try {
      const { error } = await supabase
        .from("bag_collections")
        .update({
          collected: true,
          collected_by: user!.id,
          collected_at: new Date().toISOString(),
        })
        .eq("id", collectionId)

      if (error) throw error

      fetchCollections()
      alert("Collection marked as completed!")
    } catch (error) {
      console.error("Error marking as collected:", error)
      alert("Error updating collection status.")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-800">Loading Worker dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">Please log in to access the worker dashboard.</p>
          <a href="/" className="text-blue-600 hover:underline">
            Go to Home
          </a>
        </div>
      </div>
    )
  }

  const pendingCollections = collections.filter((c) => !c.collected)
  const completedCollections = collections.filter((c) => c.collected)
  const totalBags = collections.reduce((sum, collection) => sum + collection.bag_count, 0)
  const collectedBags = completedCollections.reduce((sum, collection) => sum + collection.bag_count, 0)

  return (
    <div className="min-h-screen bg-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-blue-900">Council Worker Dashboard</h1>
                <p className="text-blue-700">Collection Management System 🚛</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-blue-600">
                <Clock className="h-4 w-4 inline mr-1" />
                Session expires in 15 min
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-red-200 bg-gradient-to-br from-red-50 to-red-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Pending Collections</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">{pendingCollections.length}</div>
              <p className="text-xs text-red-600 mt-1">Awaiting pickup 📍</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {
                  completedCollections.filter(
                    (c) => new Date(c.collected_at!).toDateString() === new Date().toDateString(),
                  ).length
                }
              </div>
              <p className="text-xs text-green-600 mt-1">Great work! ✅</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Total Bags</CardTitle>
              <Trash2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{totalBags}</div>
              <p className="text-xs text-blue-600 mt-1">Community total 🗑️</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Bags Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{collectedBags}</div>
              <p className="text-xs text-purple-600 mt-1">Successfully processed 🎯</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList className="bg-blue-100 border-blue-200">
            <TabsTrigger value="map" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Collection Map
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Pending ({pendingCollections.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-900 flex items-center">
                  <Navigation className="h-5 w-5 mr-2" />
                  Collection Points Map
                </CardTitle>
                <CardDescription className="text-blue-700">
                  Red markers show pending collections, green markers show completed collections
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-96 rounded-lg overflow-hidden border border-blue-200">
                  <MapComponent
                    center={{ lat: 52.9548, lng: -1.1581 }} // Nottingham coordinates
                    collections={collections}
                    showAllCollections={true}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-900">Pending Collections</CardTitle>
                <CardDescription className="text-blue-700">Bags waiting to be collected</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {pendingCollections.map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-4 border border-blue-200 rounded-lg bg-blue-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900">{collection.location_name}</span>
                          {collection.postcode && (
                            <Badge variant="outline" className="border-blue-300 text-blue-700">
                              {collection.postcode}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            {collection.bag_count} bag{collection.bag_count > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-700">{collection.area_cleaned}</p>
                        <p className="text-sm text-blue-600">
                          By: {collection.profiles.full_name} • {new Date(collection.created_at).toLocaleDateString()}
                        </p>
                        {collection.profiles.phone && (
                          <p className="text-sm text-blue-600">📞 {collection.profiles.phone}</p>
                        )}
                        {collection.notes && <p className="text-sm text-blue-600 mt-1">Note: {collection.notes}</p>}
                      </div>
                      <Button
                        onClick={() => markAsCollected(collection.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Mark Collected
                      </Button>
                    </div>
                  ))}
                  {pendingCollections.length === 0 && (
                    <div className="text-center py-8 text-blue-600">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                      <p>No pending collections! Great job! 🎉</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <Card className="border-blue-200">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-900">Completed Collections</CardTitle>
                <CardDescription className="text-blue-700">Recently collected bags</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {completedCollections.slice(0, 20).map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-4 border border-green-200 rounded-lg bg-green-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-900">{collection.location_name}</span>
                          {collection.postcode && (
                            <Badge variant="outline" className="border-green-300 text-green-700">
                              {collection.postcode}
                            </Badge>
                          )}
                          <Badge variant="default" className="bg-green-600">
                            {collection.bag_count} bag{collection.bag_count > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <p className="text-sm text-green-700">{collection.area_cleaned}</p>
                        <p className="text-sm text-green-600">
                          By: {collection.profiles.full_name} • Collected:{" "}
                          {new Date(collection.collected_at!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {completedCollections.length === 0 && (
                    <p className="text-center text-blue-600 py-8">No completed collections yet.</p>
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
