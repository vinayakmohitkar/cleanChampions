"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Trash2, Package, Shield, LogOut, CheckCircle, Clock, BarChart3, Settings } from "lucide-react"

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
  postcode?: string
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
  const { user, profile, signOut, loading: authLoading } = useAuth()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [collections, setCollections] = useState<BagCollection[]>([])
  const [supplyRequests, setSupplyRequests] = useState<SupplyRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && profile && profile.user_type === "admin") {
      fetchProfiles()
      fetchCollections()
      fetchSupplyRequests()
    }
  }, [user, profile])

  useEffect(() => {
    if (!authLoading) {
      if (!user || !profile) {
        console.log("No user or profile, redirecting to home")
        window.location.href = "/"
        return
      }
      if (profile.user_type !== "admin") {
        console.log(`User type ${profile.user_type} not allowed on admin page, redirecting`)
        // Redirect to correct dashboard
        switch (profile.user_type) {
          case "champion":
            window.location.href = "/champion"
            break
          case "worker":
            window.location.href = "/worker"
            break
          default:
            window.location.href = "/"
        }
        return
      }
    }
  }, [user, profile, authLoading])

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
      alert(`Supply request ${status} successfully!`)
    } catch (error) {
      console.error("Error updating supply request:", error)
      alert("Error updating supply request status.")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-purple-800">Loading Admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile || profile.user_type !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have admin privileges.</p>
          <a href="/" className="text-blue-600 hover:underline">
            Go to Home
          </a>
        </div>
      </div>
    )
  }

  const champions = profiles.filter((p) => p.user_type === "champion")
  const workers = profiles.filter((p) => p.user_type === "worker")
  const totalBags = collections.reduce((sum, collection) => sum + collection.bag_count, 0)
  const pendingSupplyRequests = supplyRequests.filter((r) => r.status === "pending")

  return (
    <div className="min-h-screen bg-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-purple-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-600 p-2 rounded-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-purple-900">Admin Dashboard</h1>
                <p className="text-purple-700">System Administration & Analytics 🔧</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-purple-600">
                <Clock className="h-4 w-4 inline mr-1" />
                Session expires in 15 min
              </div>
              <Button
                variant="outline"
                onClick={signOut}
                className="border-purple-300 text-purple-700 hover:bg-purple-100 bg-transparent"
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
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Clean Champions</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{champions.length}</div>
              <p className="text-xs text-green-600 mt-1">Active volunteers 🌟</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Council Workers</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{workers.length}</div>
              <p className="text-xs text-blue-600 mt-1">Staff members 🚛</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">Total Bags</CardTitle>
              <Trash2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{totalBags}</div>
              <p className="text-xs text-purple-600 mt-1">Community impact 🗑️</p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">Pending Requests</CardTitle>
              <Package className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{pendingSupplyRequests.length}</div>
              <p className="text-xs text-orange-600 mt-1">Awaiting approval 📦</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-purple-100 border-purple-200">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              User Management
            </TabsTrigger>
            <TabsTrigger
              value="collections"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              Collections
            </TabsTrigger>
            <TabsTrigger value="supplies" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              Supply Requests
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-purple-900 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Collection Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-purple-800">Total Collections:</span>
                      <span className="font-semibold text-purple-900">{collections.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-800">Total Bags:</span>
                      <span className="font-semibold text-green-900">{totalBags}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-800">Collected Bags:</span>
                      <span className="font-semibold text-blue-900">
                        {collections.filter((c) => c.collected).reduce((sum, c) => sum + c.bag_count, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                      <span className="text-red-800">Pending Collections:</span>
                      <span className="font-semibold text-red-900">
                        {collections.filter((c) => !c.collected).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-purple-900 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    User Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-purple-800">Total Users:</span>
                      <span className="font-semibold text-purple-900">{profiles.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-800">Clean Champions:</span>
                      <span className="font-semibold text-green-900">{champions.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-800">Council Workers:</span>
                      <span className="font-semibold text-blue-900">{workers.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-orange-800">Admins:</span>
                      <span className="font-semibold text-orange-900">
                        {profiles.filter((p) => p.user_type === "admin").length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-purple-900">Clean Champions</CardTitle>
                  <CardDescription className="text-purple-700">Community volunteers</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {champions.map((champion) => (
                      <div
                        key={champion.id}
                        className="flex items-center justify-between p-3 border border-green-200 rounded-lg bg-green-50"
                      >
                        <div>
                          <p className="font-medium text-green-900">{champion.full_name}</p>
                          <p className="text-sm text-green-700">{champion.email}</p>
                          {champion.preferred_area && (
                            <p className="text-sm text-green-600">Area: {champion.preferred_area}</p>
                          )}
                          {champion.phone && <p className="text-sm text-green-600">📞 {champion.phone}</p>}
                        </div>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Champion
                        </Badge>
                      </div>
                    ))}
                    {champions.length === 0 && (
                      <p className="text-center text-purple-600 py-4">No champions registered yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-purple-200">
                <CardHeader className="bg-purple-50">
                  <CardTitle className="text-purple-900">Council Workers</CardTitle>
                  <CardDescription className="text-purple-700">Staff members</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    {workers.map((worker) => (
                      <div
                        key={worker.id}
                        className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50"
                      >
                        <div>
                          <p className="font-medium text-blue-900">{worker.full_name}</p>
                          <p className="text-sm text-blue-700">{worker.email}</p>
                          {worker.phone && <p className="text-sm text-blue-600">📞 {worker.phone}</p>}
                        </div>
                        <Badge variant="default" className="bg-blue-600">
                          Worker
                        </Badge>
                      </div>
                    ))}
                    {workers.length === 0 && (
                      <p className="text-center text-purple-600 py-4">No workers registered yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="collections" className="space-y-6">
            <Card className="border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-purple-900">Recent Collections</CardTitle>
                <CardDescription className="text-purple-700">Latest bag collections from champions</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {collections.slice(0, 20).map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center justify-between p-4 border border-purple-200 rounded-lg bg-purple-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-purple-900">{collection.location_name}</span>
                          {collection.postcode && (
                            <Badge variant="outline" className="border-purple-300 text-purple-700">
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
                        <p className="text-sm text-purple-700">{collection.area_cleaned}</p>
                        <p className="text-sm text-purple-600">
                          By: {collection.profiles.full_name} • {collection.bag_count} bag
                          {collection.bag_count > 1 ? "s" : ""} • {new Date(collection.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {collections.length === 0 && (
                    <p className="text-center text-purple-600 py-8">No collections logged yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supplies" className="space-y-6">
            <Card className="border-purple-200">
              <CardHeader className="bg-purple-50">
                <CardTitle className="text-purple-900">Supply Requests</CardTitle>
                <CardDescription className="text-purple-700">Manage supply requests from champions</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {supplyRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 border border-purple-200 rounded-lg bg-purple-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium capitalize text-purple-900">{request.request_type}</span>
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
                        <p className="text-sm text-purple-700">
                          Quantity: {request.quantity} • By: {request.profiles.full_name}
                        </p>
                        <p className="text-sm text-purple-600">
                          {request.profiles.email} • {new Date(request.created_at).toLocaleDateString()}
                        </p>
                        {request.notes && <p className="text-sm text-purple-600 mt-1">Note: {request.notes}</p>}
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
                    <p className="text-center text-purple-600 py-8">No supply requests yet</p>
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
