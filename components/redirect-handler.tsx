"use client"

import { useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function RedirectHandler() {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && profile) {
      const currentPath = window.location.pathname

      // Determine the correct path based on user type
      let targetPath = "/"

      switch (profile.user_type) {
        case "champion":
          targetPath = "/champion"
          break
        case "worker":
          targetPath = "/worker"
          break
        case "admin":
          targetPath = "/admin"
          break
        default:
          targetPath = "/"
      }

      // Only redirect if we're not already on the correct page
      if (currentPath !== targetPath && currentPath === "/") {
        console.log(`Redirecting ${profile.user_type} from ${currentPath} to ${targetPath}`)
        router.push(targetPath)
      }
    }
  }, [user, profile, loading, router])

  return null
}
