'use client'
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import PostComposer from "./components/PostComposer"
import PostFeed from "./components/PostFeed"
import InstallPWA from "./components/InstallPWA"
// @ts-ignore
import { useLocation } from "@/hooks/useLocation"

export default function Home() {
  const { data: session } = useSession()
  const { location, loading } = useLocation()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [displayLocation, setDisplayLocation] = useState({ lat: 37.7749, lng: -122.4194 })
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    if (location) setDisplayLocation(location)

    // Check if user has dismissed the install banner
    const dismissed = localStorage.getItem('pwa-banner-dismissed')
    setShowInstallBanner(!dismissed)
  }, [location])

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  const handleDismissBanner = () => {
    localStorage.setItem('pwa-banner-dismissed', 'true')
    setShowInstallBanner(false)
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div className="-mx-4 -mt-4 mb-2">
          <InstallPWA variant="banner" onDismiss={handleDismissBanner} />
        </div>
      )}

      {/* We render feed immediately with default or real location */}
      {/* Composer only for logged in users */}
      {session && <PostComposer location={displayLocation} onPostCreated={handlePostCreated} />}

      {/* Feed */}
      <PostFeed location={displayLocation} refreshTrigger={refreshTrigger} />
    </div>
  )
}
