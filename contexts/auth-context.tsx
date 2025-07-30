"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import { SessionManager } from "@/lib/session-manager"

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
  const sessionManager = SessionManager.getInstance()

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
          // Start session management
          sessionManager.startSession(() => signOut())
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
      } finally {
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

      if (currentUser) {
        await fetchProfile(currentUser.id)
        sessionManager.startSession(() => signOut())
      } else {
        setProfile(null)
        sessionManager.clearSession()
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
      sessionManager.clearSession()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId)

      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

      if (error && error.code === "PGRST116") {
        console.log("Profile not found, will be created on signup")
        return
      }

      if (error) {
        console.error("Error fetching profile:", error)
        return
      }

      console.log("Profile fetched:", data)
      setProfile(data)
    } catch (error) {
      console.error("Error in fetchProfile:", error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in:", email)
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error)
        return { error }
      }

      return { error: null }
    } catch (error) {
      console.error("Error in signIn:", error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      console.log("Attempting to sign up:", email, userData)

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

        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: email,
            full_name: userData.name,
            phone: userData.phone || null,
            preferred_area: userData.area || null,
            user_type: userData.userType,
          },
          {
            onConflict: "id",
          },
        )

        if (profileError) {
          console.error("Error creating profile:", profileError)
          return { error: profileError }
        }

        console.log("Profile created successfully")

        setProfile({
          id: data.user.id,
          email: email,
          full_name: userData.name,
          phone: userData.phone || null,
          preferred_area: userData.area || null,
          user_type: userData.userType,
        })
      }

      return { error: null }
    } catch (error) {
      console.error("Error in signUp:", error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      sessionManager.clearSession()
      await supabase.auth.signOut()
      setProfile(null)
      setUser(null)

      // Clear all storage and cookies
      localStorage.clear()
      sessionStorage.clear()

      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=")
        const name = eqPos > -1 ? c.substr(0, eqPos) : c
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
      })

      // Redirect to home
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
      // Force redirect even if there's an error
      window.location.href = "/"
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
