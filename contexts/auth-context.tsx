"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

type Profile = {
  id: string
  email: string
  full_name: string
  phone: string | null
  preferred_area: string | null
  user_type: "champion" | "worker" | "admin"
}

type AuthContextType = {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Error getting session:", error)
        }

        const currentUser = session?.user ?? null
        setUser(currentUser)

        if (currentUser) {
          await fetchProfile(currentUser.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)

      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser && event === "SIGNED_IN") {
        await fetchProfile(currentUser.id)
      } else if (event === "SIGNED_OUT") {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId)

      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error && error.code === "PGRST116") {
        console.log("Profile not found")
        setProfile(null)
        setLoading(false)
        return null
      }

      if (error) {
        console.error("Error fetching profile:", error)
        setProfile(null)
        setLoading(false)
        return null
      }

      console.log("Profile fetched successfully:", data)
      setProfile(data)
      setLoading(false)
      return data
    } catch (error) {
      console.error("Error in fetchProfile:", error)
      setProfile(null)
      setLoading(false)
      return null
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        return { error }
      }

      console.log("Sign in successful, user:", data.user?.email)
      return { error: null }
    } catch (error) {
      console.error("Error in signIn:", error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log("Attempting to sign up:", email, "as", userData.userType)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        },
      })

      if (error) {
        console.error("Sign up error:", error)
        return { error }
      }

      if (data.user) {
        console.log("User created:", data.user.id)

        const profileData = {
          id: data.user.id,
          email: email,
          full_name: userData.name,
          phone: userData.phone || null,
          preferred_area: userData.area || null,
          user_type: userData.userType,
        }

        console.log("Creating profile with data:", profileData)

        const { error: profileError } = await supabase.from("profiles").upsert(profileData, {
          onConflict: "id",
        })

        if (profileError) {
          console.error("Error creating profile:", profileError)
          return { error: profileError }
        }

        console.log("Profile created successfully")
        setProfile(profileData)
      }

      return { error: null }
    } catch (error) {
      console.error("Error in signUp:", error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log("Signing out user...")

      await supabase.auth.signOut()

      setProfile(null)
      setUser(null)

      // Only clear auth-related storage, not all storage
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes("supabase") || key.includes("auth") || key.includes("session"))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key))

      // Clear auth cookies only
      const authCookies = ["sb-access-token", "sb-refresh-token"]
      authCookies.forEach((cookieName) => {
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`
        document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`
      })

      // Don't force redirect - let the user navigate naturally
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
