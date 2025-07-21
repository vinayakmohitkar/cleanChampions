"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Trash2, Package, Shield, LogOut, CheckCircle } from "lucide-react"

type Profile = {
  id: string
  email: string
  full_name: string
  phone: string | null
  preferred_area: string | null
  user_type: "champion" | "worker" | "admin"
  created_at: string
}

type BagCollection = {
  id: string
  champion_id: string
  location_name: string
  bag_count: number
  area_cleaned: string
  collected: boolean
  created_at: string
  profiles: {
    full_name: string
  }
}

type SupplyRequest = {
  id: string
  champion_id: string
  request_type: "bags" | "gloves" | "both"
  quantity: number
  notes: string | null
  status: "pending" | "approved" | "delivered"
  created_at: string
  profiles: {
    full_name: string
    email: string
  }
}

export default function AdminDashboard() {
  const { user, profile, signOut } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [collections, setCollections] = useState<BagCollection[]>([])
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && profile?.user_type === "admin") {
      fetchProfiles()
      fetchCollections()
      fetchSupplyRequests()
    }
  }, [user, profile])

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setProfiles(data || [])
    } catch (error) {
      console.error("Error fetching profiles:", error)
    }
  }

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from("bag_collections")
        .select(`
          *,
          profiles:champion_id (
            full_name
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setCollections(data || [])
    } catch (error) {
      console.error("Error fetching collections:", error)
    }
  }

  const fetchSupplyRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("supply_requests")
        .select(`
          *,
          profiles:champion_id (
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setSupplyRequests(data || [])
    } catch (error) {
      console.error("Error fetching supply requests:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateSupplyRequestStatus = async (requestId: string, status: "approved" | "delivered") => {
    try {
      const { error } = await supabase.from("supply_requests").update({ status }).eq("id", requestId)

      if (error) throw error
      fetchSupplyRequests()
    } catch (error) {
      console.error("Error updating supply request:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (profile?.user_type !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have admin privileges.</p>
        </div>
      </div>
    )
  }

  const champions = profiles.filter((p) => p.user_type === "champion")
  const workers = profiles.filter((p) => p.user_type === "worker")
  const totalBags = collections.reduce((sum, collection) => sum + collection.bag_count, 0)
  const pendingSupplyRequests = supplyRequests.filter((r) => r.status === "pending")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">System Administration</p>
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
              <CardTitle className="text-sm font-medium">Clean Champions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{champions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Council Workers</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{workers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bags</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalBags}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingSupplyRequests.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="supplies">Supply Requests</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Clean Champions</CardTitle>
                  <CardDescription>Community volunteers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {champions.map((champion) => (
                      <div key={champion.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{champion.full_name}</p>
                          <p className="text-sm text-gray-600">{champion.email}</p>
                          {champion.preferred_area && (
                            <p className="text-sm text-gray-500">Area: {champion.preferred_area}</p>
                          )}
                        </div>
                        <Badge variant="secondary">Champion</Badge>
                      </div>
                    ))}
                    {champions.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No champions registered yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Council Workers</CardTitle>
                  <CardDescription>Staff members</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {workers.map((worker) => (
                      <div key={worker.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{worker.full_name}</p>
                          <p className="text-sm text-gray-600">{worker.email}</p>
                        </div>
                        <Badge variant="default">Worker</Badge>
                      </div>
                    ))}
                    {workers.length === 0 && (
                      <p className="text-center text-gray-500 py-4">No workers registered yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Collections</CardTitle>
                <CardDescription>Latest bag collections from champions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {collections.slice(0, 20).map((collection) => (
                    <div key={collection.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium">{collection.location_name}</span>
                          <Badge variant={collection.collected ? "default" : "secondary"}>
                            {collection.collected ? "Collected" : "Pending"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{collection.area_cleaned}</p>
                        <p className="text-sm text-gray-500">
                          By: {collection.profiles.full_name} • {collection.bag_count} bag
                          {collection.bag_count > 1 ? "s" : ""} • {new Date(collection.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {collections.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No collections logged yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supplies" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Supply Requests</CardTitle>
                <CardDescription>Manage supply requests from champions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supplyRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
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
                        <p className="text-sm text-gray-600">
                          Quantity: {request.quantity} • By: {request.profiles.full_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.profiles.email} • {new Date(request.created_at).toLocaleDateString()}
                        </p>
                        {request.notes && <p className="text-sm text-gray-600 mt-1">Note: {request.notes}</p>}
                      </div>
                      {request.status === "pending" && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => updateSupplyRequestStatus(request.id, "approved")}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      )}
                      {request.status === "approved" && (
                        <Button
                          size="sm"
                          onClick={() => updateSupplyRequestStatus(request.id, "delivered")}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  ))}
                  {supplyRequests.length === 0 && (
                    <p className="text-center text-gray-500 py-8">No supply requests yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Collection Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Collections:</span>
                      <span className="font-semibold">{collections.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Bags:</span>
                      <span className="font-semibold">{totalBags}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Collected Bags:</span>
                      <span className="font-semibold">
                        {collections.filter((c) => c.collected).reduce((sum, c) => sum + c.bag_count, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Collections:</span>
                      <span className="font-semibold">{collections.filter((c) => !c.collected).length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <span className="font-semibold">{profiles.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Clean Champions:</span>
                      <span className="font-semibold">{champions.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Council Workers:</span>
                      <span className="font-semibold">{workers.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Admins:</span>
                      <span className="font-semibold">{profiles.filter((p) => p.user_type === "admin").length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
