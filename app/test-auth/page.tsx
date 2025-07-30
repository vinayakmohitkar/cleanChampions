"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

export default function TestAuth() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p>Loading authentication...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">🧪 Auth Test Page</h1>

      <div className="space-y-4 bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">User Status:</span>
          <span
            className={`px-2 py-1 rounded text-sm ${user ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {user ? "✅ Logged in" : "❌ Not logged in"}
          </span>
        </div>

        {user && (
          <div className="space-y-2">
            <div>
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>User ID:</strong> {user.id}
            </div>
            <div>
              <strong>Created:</strong> {new Date(user.created_at).toLocaleString()}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <span className="font-semibold">Profile Status:</span>
          <span
            className={`px-2 py-1 rounded text-sm ${profile ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {profile ? "✅ Loaded" : "❌ Not loaded"}
          </span>
        </div>

        {profile && (
          <div className="space-y-2 bg-white p-3 rounded border">
            <div>
              <strong>Name:</strong> {profile.full_name}
            </div>
            <div>
              <strong>User Type:</strong>
              <span
                className={`ml-2 px-2 py-1 rounded text-sm ${
                  profile.user_type === "champion"
                    ? "bg-green-100 text-green-800"
                    : profile.user_type === "worker"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                }`}
              >
                {profile.user_type}
              </span>
            </div>
            <div>
              <strong>Phone:</strong> {profile.phone || "Not provided"}
            </div>
            <div>
              <strong>Area:</strong> {profile.preferred_area || "Not provided"}
            </div>
          </div>
        )}
      </div>

      {user && profile && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">🚀 Dashboard Links</h2>
          <div className="space-x-4">
            <a href="/champion" className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              Champion Dashboard
            </a>
            <a href="/worker" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Worker Dashboard
            </a>
            <a href="/admin" className="inline-block bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
              Admin Dashboard
            </a>
          </div>
        </div>
      )}

      <div className="mt-8 space-x-4">
        <a href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </a>
        {user && (
          <Button onClick={signOut} variant="outline">
            Sign Out
          </Button>
        )}
      </div>

      {!user && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-yellow-800">
            <strong>Not logged in?</strong> Go back to the home page and try registering or logging in.
          </p>
        </div>
      )}
    </div>
  )
}
