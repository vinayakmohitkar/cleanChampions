"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Shield, Trash2, Award, Bell, ArrowRight } from "lucide-react"
import LoginModal from "./components/login-modal"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

type Stats = {
  totalBags: number
  activeChampions: number
  areasCleanedCount: number
  collectedBags: number
}

export default function HomePage() {
  const { user, profile, loading } = useAuth()
  const [loginModal, setLoginModal] = useState<{ isOpen: boolean; userType: string }>({
    isOpen: false,
    userType: "",
  })
  const [stats, setStats] = useState<Stats>({
    totalBags: 0,
    activeChampions: 0,
    areasCleanedCount: 0,
    collectedBags: 0,
  })
  const [statsLoading, setStatsLoading] = useState(true)

  const openLogin = (userType: string) => {
    setLoginModal({ isOpen: true, userType })
  }

  const closeLogin = () => {
    setLoginModal({ isOpen: false, userType: "" })
  }

  // Fetch statistics on component mount
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setStatsLoading(true)

      // Get total bags and collections
      const { data: collections, error: collectionsError } = await supabase
        .from("bag_collections")
        .select("bag_count, collected, champion_id")

      if (collectionsError) {
        console.error("Error fetching collections:", collectionsError)
      }

      // Get active champions count
      const { data: champions, error: championsError } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_type", "champion")

      if (championsError) {
        console.error("Error fetching champions:", championsError)
      }

      // Calculate stats
      const totalBags = collections?.reduce((sum, collection) => sum + collection.bag_count, 0) || 0
      const collectedBags =
        collections?.filter((c) => c.collected).reduce((sum, collection) => sum + collection.bag_count, 0) || 0
      const activeChampions = champions?.length || 0
      const areasCleanedCount = collections?.length || 0

      setStats({
        totalBags,
        activeChampions,
        areasCleanedCount,
        collectedBags,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  const getDashboardLink = () => {
    if (!user || !profile) return null

    switch (profile.user_type) {
      case "champion":
        return { href: "/champion", label: "Go to Champion Dashboard", color: "green" }
      case "worker":
        return { href: "/worker", label: "Go to Worker Dashboard", color: "blue" }
      case "admin":
        return { href: "/admin", label: "Go to Admin Dashboard", color: "purple" }
      default:
        return null
    }
  }

  const dashboardLink = getDashboardLink()

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <div className="bg-green-600 p-2 rounded-lg">
                  <Trash2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Clean Champions</h1>
                  <p className="text-sm text-gray-600">Community Litter Collection</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                {user && profile ? (
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      Welcome, <span className="font-medium">{profile.full_name}</span>
                    </span>
                    {dashboardLink && (
                      <a
                        href={dashboardLink.href}
                        className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium text-white bg-${dashboardLink.color}-600 hover:bg-${dashboardLink.color}-700 transition-colors`}
                      >
                        {dashboardLink.label}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    )}
                  </div>
                ) : (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Free Community App
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Keep Our Community Clean Together</h2>
            <p className="text-xl text-gray-600 mb-8">
              Connect volunteers, council workers, and administrators to efficiently manage community litter collection
              efforts.
            </p>

            {/* Real-time Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mx-auto"></div>
                  ) : (
                    stats.totalBags
                  )}
                </div>
                <div className="text-gray-600">Total Bags Logged</div>
                <div className="text-sm text-green-600 mt-1">
                  {statsLoading ? "..." : `${stats.collectedBags} collected`}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mx-auto"></div>
                  ) : (
                    stats.activeChampions
                  )}
                </div>
                <div className="text-gray-600">Active Champions</div>
                <div className="text-sm text-blue-600 mt-1">Community volunteers</div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {statsLoading ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mx-auto"></div>
                  ) : (
                    stats.areasCleanedCount
                  )}
                </div>
                <div className="text-gray-600">Areas Cleaned</div>
                <div className="text-sm text-purple-600 mt-1">Collection points</div>
              </div>
            </div>

            {/* Show dashboard link for logged in users */}
            {user && profile && dashboardLink && (
              <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to continue?</h3>
                <p className="text-gray-600 mb-4">Access your personalized dashboard</p>
                <a
                  href={dashboardLink.href}
                  className="inline-flex items-center px-6 py-3 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors font-medium"
                >
                  {dashboardLink.label}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* User Type Cards - Only show if not logged in */}
        {!user && (
          <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-6xl mx-auto">
              <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">Choose Your Role</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Clean Champion Card */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-200">
                  <CardHeader className="text-center">
                    <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      <Award className="h-8 w-8 text-green-600" />
                    </div>
                    <CardTitle className="text-green-700">Clean Champion</CardTitle>
                    <CardDescription>Community volunteers who collect litter and make a difference</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>Log bag locations with postcodes</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Trash2 className="h-4 w-4" />
                      <span>Track your impact</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Bell className="h-4 w-4" />
                      <span>Request supplies</span>
                    </div>
                    <Button
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      onClick={() => openLogin("champion")}
                    >
                      Join as Champion
                    </Button>
                  </CardContent>
                </Card>

                {/* Council Worker Card */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-200">
                  <CardHeader className="text-center">
                    <div className="mx-auto bg-blue-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-blue-700">Council Worker</CardTitle>
                    <CardDescription>Council staff who collect the purple bags from locations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>View collection map</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Trash2 className="h-4 w-4" />
                      <span>Mark bags collected</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Bell className="h-4 w-4" />
                      <span>Route optimization</span>
                    </div>
                    <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => openLogin("worker")}>
                      Worker Login
                    </Button>
                  </CardContent>
                </Card>

                {/* Admin Card */}
                <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-200">
                  <CardHeader className="text-center">
                    <div className="mx-auto bg-purple-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      <Shield className="h-8 w-8 text-purple-600" />
                    </div>
                    <CardTitle className="text-purple-700">Administrator</CardTitle>
                    <CardDescription>Council administrators who manage the system and users</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Manage users</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>System analytics</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Shield className="h-4 w-4" />
                      <span>Full system control</span>
                    </div>
                    <Button
                      className="w-full mt-4 bg-purple-600 hover:bg-purple-700"
                      onClick={() => openLogin("admin")}
                    >
                      Admin Login
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">How It Works</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                  <Trash2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Collect & Log</h4>
                  <p className="text-gray-600">
                    Clean Champions collect litter in purple bags and log their location with postcodes in the app
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
                  <MapPin className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Map & Collect</h4>
                  <p className="text-gray-600">
                    Council workers see bag locations on a map and collect them efficiently
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-2 rounded-lg flex-shrink-0">
                  <Bell className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Notify & Track</h4>
                  <p className="text-gray-600">
                    Automatic notifications keep everyone informed of collections and progress
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 p-2 rounded-lg flex-shrink-0">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Celebrate Impact</h4>
                  <p className="text-gray-600">
                    Track community progress and celebrate the positive environmental impact
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="bg-green-600 p-2 rounded-lg">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">Clean Champions</span>
            </div>
            <p className="text-gray-400">Built with free, open-source technologies for community impact</p>
            <p className="text-sm text-gray-500 mt-2">Powered by Supabase • Next.js • Vercel</p>
          </div>
        </footer>

        {/* Login Modal */}
        <LoginModal isOpen={loginModal.isOpen} userType={loginModal.userType} onClose={closeLogin} />
      </div>
    </>
  )
}
