'use client'
import { useEffect } from 'react'

export default function PWARegister() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            // FORCE UNREGISTER: Kill any existing service workers to clear stale cache
            navigator.serviceWorker.getRegistrations().then(function (registrations) {
                for (let registration of registrations) {
                    registration.unregister()
                    console.log('Service Worker Force Unregistered:', registration)
                }
            })
        }
    }, [])

    return null
}
