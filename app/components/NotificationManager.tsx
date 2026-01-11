'use client'
import { useState, useEffect } from 'react'
import { useLocation } from '@/hooks/useLocation'

export default function NotificationManager() {
    const { location } = useLocation()
    // Initialize with current time to avoid fetching old posts immediately on reload as "new"
    const [lastChecked, setLastChecked] = useState<string | null>(null)

    useEffect(() => {
        setLastChecked(new Date().toISOString())

        // Request permission on mount
        if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
    }, [])

    useEffect(() => {
        if (!location || !lastChecked) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/notifications?lat=${location.lat}&lng=${location.lng}&lastChecked=${lastChecked}`)
                const data = await res.json()

                if (data.posts && data.posts.length > 0) {
                    // Update last checked to the most recent post's time or now
                    setLastChecked(new Date().toISOString())

                    const latest = data.posts[0];
                    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                        new Notification(`Nearby Activity: ${latest.content}`)
                    } else {
                        console.log("New activity nearby:", latest.content)
                        // Fallback alert or custom toast could go here
                        alert(`New JoinMe Request Nearby: ${latest.content}`)
                    }
                }
            } catch (e) {
                console.error("Polling error", e)
            }
        }, 15000) // check every 15s

        return () => clearInterval(interval)
    }, [location, lastChecked])

    return null;
}
