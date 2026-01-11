'use client'
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import PostComposer from "./components/PostComposer"
import PostFeed from "./components/PostFeed"
// @ts-ignore
import { useLocation } from "@/hooks/useLocation"

export default function Home() {
  const { data: session } = useSession()
  const { location, loading } = useLocation()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [displayLocation, setDisplayLocation] = useState({ lat: 37.7749, lng: -122.4194 })

  useEffect(() => {
    if (location) setDisplayLocation(location)
  }, [location])

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* We render feed immediately with default or real location */}
      {/* Composer only for logged in users */}
      {session && <PostComposer location={displayLocation} onPostCreated={handlePostCreated} />}

      {/* Feed */}
      <PostFeed location={displayLocation} refreshTrigger={refreshTrigger} />
    </div>
  )
}
