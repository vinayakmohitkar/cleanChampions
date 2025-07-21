"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"

export default function RedirectHandler() {
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && user && profile) {
      const path =
        profile.user_type === "champion"
          ? "/champion"
          : profile.user_type === "worker"
            ? "/worker"
            : profile.user_type === "admin"
              ? "/admin"
              : "/"

      if (window.location.pathname !== path) {
        window.location.href = path
      }
    }
  }, [user, profile, loading])

  return null
}
