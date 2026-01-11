'use client'
import { useTheme } from "next-themes"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const { data: session } = useSession()
    const [radius, setRadius] = useState(1.0)
    const [saving, setSaving] = useState(false)
    const router = useRouter()

    useEffect(() => {
        if (session) {
            fetch('/api/users')
                .then(res => res.json())
                .then(data => {
                    if (data.radiusKm) setRadius(data.radiusKm)
                })
        }
    }, [session])

    const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRadius(parseFloat(e.target.value))
    }

    const saveSettings = async () => {
        setSaving(true)
        await fetch('/api/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ radiusKm: radius })
        })
        setSaving(false)
    }

    const requestNotifications = () => {
        if (!("Notification" in window)) {
            alert("This browser does not support desktop notification");
        } else if (Notification.permission === "granted") {
            alert("Notifications already granted!");
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    alert("Notifications granted!");
                }
            });
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="card">
                <h2 className="font-bold mb-4 text-xl">Appearance</h2>
                <div className="flex items-center justify-between">
                    <span>Theme</span>
                    <select
                        value={theme}
                        onChange={(e) => setTheme(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)' }}
                    >
                        <option value="system">System</option>
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                    </select>
                </div>
            </div>

            <div className="card">
                <h2 className="font-bold mb-4 text-xl">Discovery</h2>
                <div className="flex flex-col gap-2">
                    <div className="flex justify-between">
                        <span>Search Radius</span>
                        <span className="font-bold">{radius} km</span>
                    </div>
                    <input
                        type="range"
                        min="0.5"
                        max="20"
                        step="0.5"
                        value={radius}
                        onChange={handleRadiusChange}
                        className="w-full"
                    />
                    <div className="flex justify-end mt-2">
                        <button onClick={saveSettings} disabled={saving} className="btn-primary">
                            {saving ? 'Saving...' : 'Save Radius'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 className="font-bold mb-4 text-xl">Notifications</h2>
                <p className="mb-4 text-secondary">Get notified when someone posts nearby.</p>
                <button onClick={requestNotifications} className="btn-primary w-full">
                    Enable Push Notifications
                </button>
            </div>

            <button
                onClick={() => router.push('/api/auth/signout')}
                className="btn-primary"
                style={{ backgroundColor: 'var(--text-secondary)', marginTop: '1rem' }}
            >
                Log Out
            </button>
        </div>
    )
}
