import { useState, useEffect } from 'react'

export function useLocation() {
    const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Default to San Francisco
        const defaultLocation = { lat: 37.7749, lng: -122.4194 }

        if (!navigator.geolocation) {
            setLocation(defaultLocation)
            setLoading(false)
            return
        }

        const timer = setTimeout(() => {
            if (!location) {
                console.log('Location timeout, using default')
                setLocation(defaultLocation)
                setLoading(false)
            }
        }, 2000) // 2 second timeout

        navigator.geolocation.getCurrentPosition(
            (position) => {
                clearTimeout(timer)
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                })
                setLoading(false)
            },
            (err) => {
                clearTimeout(timer)
                console.warn('Geolocation denied/failed, using default', err)
                setLocation(defaultLocation)
                // We don't set error state to avoid blocking UI
                setLoading(false)
            }
        )

        return () => clearTimeout(timer)
    }, [])

    return { location, error, loading }
}
