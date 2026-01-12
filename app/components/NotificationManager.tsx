'use client'
import { useState, useEffect } from 'react'
import { useLocation } from '@/hooks/useLocation'

export default function NotificationManager() {
    const { location } = useLocation()
    const [lastChecked, setLastChecked] = useState<string | null>(null)
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
        setLastChecked(new Date().toISOString())

        // Request permission on mount
        if (typeof Notification !== 'undefined' && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }

        // Page visibility detection
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden)
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [])

    useEffect(() => {
        if (!location || !lastChecked || !isVisible) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/notifications?lat=${location.lat}&lng=${location.lng}&lastChecked=${lastChecked}`)
                const data = await res.json()

                if (data.posts && data.posts.length > 0) {
                    setLastChecked(new Date().toISOString())

                    const latest = data.posts[0];
                    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                        new Notification(`Nearby Activity: ${latest.content}`)
                    }
                }
            } catch (e) {
                console.error("Polling error", e)
            }
        }, 30000) // Reduced from 15s to 30s

        return () => clearInterval(interval)
    }, [location, lastChecked, isVisible])

    return null;
}
