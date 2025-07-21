"use client"

import { useAuth } from "@/contexts/auth-context"

export default function TestAuth() {
  const { user, profile, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>

      <div className="space-y-4">
        <div>
          <strong>User:</strong> {user ? "Logged in" : "Not logged in"}
        </div>

        {user && (
          <div>
            <strong>Email:</strong> {user.email}
          </div>
        )}

        <div>
          <strong>Profile:</strong> {profile ? "Loaded" : "Not loaded"}
        </div>

        {profile && (
          <div className="space-y-2">
            <div>
              <strong>Name:</strong> {profile.full_name}
            </div>
            <div>
              <strong>User Type:</strong> {profile.user_type}
            </div>
            <div>
              <strong>Phone:</strong> {profile.phone || "Not provided"}
            </div>
            <div>
              <strong>Area:</strong> {profile.preferred_area || "Not provided"}
            </div>
          </div>
        )}

        <div className="mt-8 space-x-4">
          <a href="/champion" className="bg-green-600 text-white px-4 py-2 rounded">
            Go to Champion Dashboard
          </a>
          <a href="/worker" className="bg-blue-600 text-white px-4 py-2 rounded">
            Go to Worker Dashboard
          </a>
          <a href="/admin" className="bg-purple-600 text-white px-4 py-2 rounded">
            Go to Admin Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
