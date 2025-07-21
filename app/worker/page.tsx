"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Trash2, CheckCircle, Clock, LogOut } from "lucide-react"
import dynamic from "next/dynamic"

const MapComponent = dynamic(() => import("@/components/map-component"), { ssr: false })

type BagCollection = {
  id: string
  champion_id: string
  location_lat: number
  location_lng: number
  location_name: string
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
  const { user, profile, signOut } = useAuth()
  const [collections, setCollections] = useState<BagCollection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchCollections()
    }
  }, [user])

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

      // TODO: Send notification to champion
      fetchCollections()
    } catch (error) {
      console.error("Error marking as collected:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading collections...</p>
        </div>
      </div>
    )
  }

  const pendingCollections = collections.filter((c) => !c.collected)
  const completedCollections = collections.filter((c) => c.collected)
  const totalBags = collections.reduce((sum, collection) => sum + collection.bag_count, 0)
  const collectedBags = completedCollections.reduce((sum, collection) => sum + collection.bag_count, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Council Worker Dashboard</h1>
              <p className="text-gray-600">Collection Management System</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Collections</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{pendingCollections.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {
                  completedCollections.filter(
                    (c) => new Date(c.collected_at!).toDateString() === new Date().toDateString(),
                  ).length
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bags</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalBags}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bags Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{collectedBags}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="map" className="space-y-6">
          <TabsList>
            <TabsTrigger value="map">Collection Map</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingCollections.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Collection Points Map</CardTitle>
                <CardDescription>
                  Red markers show pending collections, green markers show completed collections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96 rounded-lg overflow-hidden">
                  <MapComponent
                    center={{ lat: 51.5074, lng: -0.1278 }} // Default to London, adjust as needed
                    collections={collections}
                    showAllCollections={true}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Collections</CardTitle>
                <CardDescription>Bags waiting to be collected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingCollections.map((collection) => (
                    <div key={collection.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{collection.location_name}</span>
                          <Badge variant="secondary">
                            {collection.bag_count} bag{collection.bag_count > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{collection.area_cleaned}</p>
                        <p className="text-sm text-gray-500">
                          By: {collection.profiles.full_name} • {new Date(collection.created_at).toLocaleDateString()}
                        </p>
                        {collection.notes && <p className="text-sm text-gray-600 mt-1">Note: {collection.notes}</p>}
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
                    <p className="text-center text-gray-500 py-8">No pending collections!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Completed Collections</CardTitle>
                <CardDescription>Recently collected bags</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedCollections.slice(0, 20).map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{collection.location_name}</span>
                          <Badge variant="default">
                            {collection.bag_count} bag{collection.bag_count > 1 ? "s" : ""}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{collection.area_cleaned}</p>
                        <p className="text-sm text-gray-500">
                          By: {collection.profiles.full_name} • Collected:{" "}
                          {new Date(collection.collected_at!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {completedCollections.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No completed collections yet.</p>
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
