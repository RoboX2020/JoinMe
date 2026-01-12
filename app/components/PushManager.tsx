'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export default function PushManager() {
    const { data: session } = useSession()
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [permission, setPermission] = useState<NotificationPermission>('default')

    useEffect(() => {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            checkSubscription()
        } else {
            setIsLoading(false)
        }
    }, [])

    const checkSubscription = async () => {
        setPermission(Notification.permission)
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            setIsSubscribed(!!subscription)
        } catch (error) {
            console.error('Error checking subscription:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const subscribe = async () => {
        setIsLoading(true)
        try {
            // 1. Request Permission
            const perm = await Notification.requestPermission()
            setPermission(perm)

            if (perm !== 'granted') {
                throw new Error('Permission denied')
            }

            // 2. Get SW Registration
            const registration = await navigator.serviceWorker.ready

            // 3. Subscribe
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
            })

            // 4. Send to Backend
            await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription)
            })

            setIsSubscribed(true)
            alert('Notifications enabled! You will now receive updates on this device.')
        } catch (error) {
            console.error('Failed to subscribe:', error)
            alert('Failed to enable notifications. Please check your browser settings.')
        } finally {
            setIsLoading(false)
        }
    }

    if (!session) return null

    if (isLoading) {
        return <div className="p-4 bg-zinc-900/50 rounded-xl animate-pulse h-16"></div>
    }

    if (!('serviceWorker' in navigator)) {
        return null // Not supported
    }

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${isSubscribed ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-400'}`}>
                    {isSubscribed ? <Bell size={20} /> : <BellOff size={20} />}
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">Notifications</h3>
                    <p className="text-xs text-zinc-400">
                        {isSubscribed ? 'Enabled on this device' : 'Get alerts for messages'}
                    </p>
                </div>
            </div>

            {!isSubscribed && (
                <button
                    onClick={subscribe}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
                >
                    Enable
                </button>
            )}

            {isSubscribed && (
                <span className="text-xs text-green-500 font-bold px-3">Active</span>
            )}
        </div>
    )
}
