'use client'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Edit2, MapPin, Users, Link as LinkIcon, Settings } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ProfileEditForm from '../components/ProfileEditForm'

export default function ProfilePage() {
    const { data: session, update } = useSession()
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [userData, setUserData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // @ts-ignore
    const userId = session?.user?.id

    const fetchUserData = useCallback(async () => {
        if (!userId) return

        try {
            const res = await fetch(`/api/users/${userId}`)
            if (res.ok) {
                const data = await res.json()
                setUserData(data)
            }
        } catch (error) {
            console.error('Error fetching user data:', error)
        } finally {
            setLoading(false)
        }
    }, [userId])

    useEffect(() => {
        fetchUserData()
    }, [fetchUserData])

    const handleSave = useCallback(async (formData: any) => {
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                const updatedData = await res.json()
                setUserData(updatedData)
                setIsEditing(false)
                // Update session if name or image changed
                if (formData.name || formData.image) {
                    await update({
                        ...session,
                        user: {
                            ...session?.user,
                            name: formData.name,
                            image: formData.image
                        }
                    })
                }
            } else {
                throw new Error('Failed to update profile')
            }
        } catch (error) {
            console.error('Error saving profile:', error)
            throw error
        }
    }, [session, update])

    // Memoize parsed data to prevent re-parsing on every render
    const socialLinks = useMemo(() => {
        return userData?.accountLinks ? JSON.parse(userData.accountLinks) : {}
    }, [userData?.accountLinks])

    const interests = useMemo(() => {
        return userData?.interests
            ? userData.interests.split(',').map((i: string) => i.trim()).filter(Boolean)
            : []
    }, [userData?.interests])

    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-6">
                <h2 className="text-2xl font-bold">Sign in to view</h2>
                <a href="/api/auth/signin" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold">Login</a>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 pb-24 pt-4">
            {isEditing ? (
                <div className="px-2">
                    <h2 className="text-2xl font-black mb-6 text-white">Edit Profile</h2>
                    <ProfileEditForm
                        initialData={userData}
                        onSave={handleSave}
                        onCancel={() => setIsEditing(false)}
                    />
                </div>
            ) : (
                <>
                    {/* Profile Header */}
                    <div className="flex flex-col items-center relative">
                        {/* Settings and Edit Buttons */}
                        <div className="absolute top-0 right-4 flex gap-2">
                            <button
                                onClick={() => router.push('/settings')}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-full transition"
                                aria-label="Settings"
                            >
                                <Settings size={18} />
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-full transition"
                            >
                                <Edit2 size={18} />
                            </button>
                        </div>

                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white/10 overflow-hidden mb-4 shadow-float">
                            <img src={userData?.image || session.user?.image || '/default-avatar.png'} className="w-full h-full object-cover" alt="Profile" />
                        </div>

                        <h1 className="text-2xl md:text-3xl font-black text-white">{userData?.name || session.user?.name}</h1>
                        {userData?.profession && (
                            <p className="text-blue-400 font-semibold text-sm mt-1">{userData.profession}</p>
                        )}
                        <p className="text-zinc-400 text-sm">{userData?.email || session.user?.email}</p>
                    </div>

                    {/* Bio */}
                    {userData?.bio && (
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 mx-2">
                            <p className="text-zinc-300 text-sm leading-relaxed">{userData.bio}</p>
                        </div>
                    )}

                    {/* Location & Radius */}
                    <div className="grid grid-cols-2 gap-3 px-2">
                        {userData?.location && (
                            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                                <MapPin size={20} className="text-blue-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs text-zinc-500 font-medium">Location</p>
                                    <p className="text-sm font-bold text-white truncate">{userData.location}</p>
                                </div>
                            </div>
                        )}
                        <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
                            <Users size={20} className="text-blue-400 shrink-0" />
                            <div>
                                <p className="text-xs text-zinc-500 font-medium">Finding Radius</p>
                                <p className="text-sm font-bold text-white">{userData?.radiusKm?.toFixed(1) || '1.0'} km</p>
                            </div>
                        </div>
                    </div>

                    {/* Interests */}
                    {interests.length > 0 && (
                        <div className="px-2">
                            <h3 className="text-sm font-bold text-zinc-400 mb-3">INTERESTS</h3>
                            <div className="flex flex-wrap gap-2">
                                {interests.map((interest: string, idx: number) => (
                                    <span
                                        key={idx}
                                        className="bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-sm font-medium border border-blue-500/30"
                                    >
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Social Links */}
                    {Object.keys(socialLinks).filter(k => socialLinks[k]).length > 0 && (
                        <div className="px-2">
                            <h3 className="text-sm font-bold text-zinc-400 mb-3">SOCIAL LINKS</h3>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(socialLinks).filter(([_, value]) => value).map(([platform, url]) => (
                                    <a
                                        key={platform}
                                        href={typeof url === 'string' && url.startsWith('http') ? url : `https://${platform}.com/${url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full text-sm font-medium border border-white/10 flex items-center gap-2 transition capitalize"
                                    >
                                        <LinkIcon size={14} />
                                        {platform}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Sign Out Button */}
                    <div className="px-2 pt-4">
                        <button
                            onClick={() => signOut()}
                            className="w-full bg-red-500/10 text-red-400 py-4 rounded-2xl font-bold border border-red-500/20 hover:bg-red-500/20 transition"
                        >
                            Log Out
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
