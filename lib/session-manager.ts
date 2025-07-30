"use client"

export class SessionManager {
  private static instance: SessionManager
  private logoutTimer: NodeJS.Timeout | null = null
  private readonly SESSION_DURATION = 15 * 60 * 1000 // 15 minutes

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  startSession(onLogout: () => void) {
    this.clearSession()

    // Set session start time
    localStorage.setItem("session_start", Date.now().toString())

    // Start logout timer
    this.logoutTimer = setTimeout(() => {
      this.forceLogout(onLogout)
    }, this.SESSION_DURATION)

    // Reset timer on user activity
    this.setupActivityListeners(onLogout)
  }

  private setupActivityListeners(onLogout: () => void) {
    const resetTimer = () => {
      if (this.logoutTimer) {
        clearTimeout(this.logoutTimer)
      }

      // Check if session is still valid
      const sessionStart = localStorage.getItem("session_start")
      if (sessionStart && Date.now() - Number.parseInt(sessionStart) < this.SESSION_DURATION) {
        this.logoutTimer = setTimeout(() => {
          this.forceLogout(onLogout)
        }, this.SESSION_DURATION)
      }
    }

    // Listen for user activity
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart", "click"]
    events.forEach((event) => {
      document.addEventListener(event, resetTimer, true)
    })
  }

  private async forceLogout(onLogout: () => void) {
    // Clear all storage
    localStorage.clear()
    sessionStorage.clear()

    // Clear cookies
    document.cookie.split(";").forEach((c) => {
      const eqPos = c.indexOf("=")
      const name = eqPos > -1 ? c.substr(0, eqPos) : c
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    })

    // Call logout function
    onLogout()

    // Redirect to home
    window.location.href = "/"
  }

  clearSession() {
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer)
      this.logoutTimer = null
    }
    localStorage.removeItem("session_start")
  }

  isSessionValid(): boolean {
    const sessionStart = localStorage.getItem("session_start")
    if (!sessionStart) return false

    return Date.now() - Number.parseInt(sessionStart) < this.SESSION_DURATION
  }
}
