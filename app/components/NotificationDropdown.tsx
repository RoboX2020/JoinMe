'use client'
import { useEffect, useState } from 'react'
import { Bell, Check, X, Loader2, UserPlus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'

interface JoinRequest {
    id: string
    status: string
    sender: {
        id: string
        name: string | null
        email: string | null
        image: string | null
    }
    post: {
        id: string
        title: string | null
        content: string
    }
    createdAt: string
}

interface FriendRequest {
    id: string
    status: string
    user: {
        id: string
        name: string | null
        email: string | null
        image: string | null
    }
    createdAt: string
}

export default function NotificationDropdown() {
    const { data: session } = useSession()
    const [isOpen, setIsOpen] = useState(false)
    const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([])
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState<string | null>(null)

    useEffect(() => {
        if (session && isOpen) {
            fetchRequests()
            fetchFriendRequests()
        }
    }, [session, isOpen])

    // Removed auto-refresh to save database bandwidth
    // effective-polling: Requests are now triggered only on mount or user interaction

    const fetchRequests = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/join-requests')
            if (res.ok) {
                const data = await res.json()
                setJoinRequests(data.filter((r: JoinRequest) => r.status === 'PENDING'))
            }
        } catch (error) {
            console.error('Error fetching join requests:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchFriendRequests = async () => {
        try {
            const res = await fetch('/api/friends')
            if (res.ok) {
                const data = await res.json()
                setFriendRequests(data.pendingRequests || [])
            }
        } catch (error) {
            console.error('Error fetching friend requests:', error)
        }
    }

    const handleUpdateJoinRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
        setProcessing(requestId)
        try {
            const res = await fetch('/api/join-requests', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, status }),
            })

            if (res.ok) {
                setJoinRequests(joinRequests.filter(r => r.id !== requestId))
            }
        } catch (error) {
            console.error('Error updating join request:', error)
        } finally {
            setProcessing(null)
        }
    }

    const handleUpdateFriendRequest = async (friendshipId: string, action: 'accept' | 'reject') => {
        setProcessing(friendshipId)
        try {
            if (action === 'accept') {
                const res = await fetch(`/api/friends/${friendshipId}`, {
                    method: 'PUT',
                })
                if (res.ok) {
                    setFriendRequests(friendRequests.filter(r => r.id !== friendshipId))
                }
            } else {
                const res = await fetch(`/api/friends/${friendshipId}`, {
                    method: 'DELETE',
                })
                if (res.ok) {
                    setFriendRequests(friendRequests.filter(r => r.id !== friendshipId))
                }
            }
        } catch (error) {
            console.error('Error updating friend request:', error)
        } finally {
            setProcessing(null)
        }
    }

    if (!session) return null

    const totalPendingCount = joinRequests.length + friendRequests.length

    return (
        <div className="relative">
            {/* Bell Icon with Badge */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-white/10 rounded-full transition"
            >
                <Bell size={20} className="text-white" />
                {totalPendingCount > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                        {totalPendingCount > 9 ? '9+' : totalPendingCount}
                    </motion.div>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown Content */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-40"
                        >
                            {/* Header */}
                            <div className="px-4 py-3 border-b border-white/10">
                                <h3 className="font-bold text-white">Notifications</h3>
                            </div>

                            {/* Content */}
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="animate-spin text-blue-500" size={24} />
                                </div>
                            ) : totalPendingCount === 0 ? (
                                <div className="px-4 py-8 text-center text-zinc-400 text-sm">
                                    No pending notifications
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {/* Friend Requests */}
                                    {friendRequests.map((request) => (
                                        <div key={request.id} className="px-4 py-3 hover:bg-white/5 transition">
                                            <div className="flex items-start gap-3">
                                                <img
                                                    src={request.user.image || '/default-avatar.png'}
                                                    alt={request.user.name || 'User'}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-semibold flex items-center gap-1">
                                                        <UserPlus size={14} className="text-blue-400" />
                                                        Friend Request
                                                    </p>
                                                    <p className="text-zinc-400 text-xs mt-0.5">
                                                        {request.user.name || 'Someone'} wants to be your friend
                                                    </p>
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => handleUpdateFriendRequest(request.id, 'accept')}
                                                            disabled={processing === request.id}
                                                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-full transition"
                                                        >
                                                            {processing === request.id ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Check size={12} />
                                                                    <span>Accept</span>
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateFriendRequest(request.id, 'reject')}
                                                            disabled={processing === request.id}
                                                            className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white text-xs px-3 py-1.5 rounded-full transition"
                                                        >
                                                            <X size={12} />
                                                            <span>Reject</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Join Requests */}
                                    {joinRequests.map((request) => (
                                        <div key={request.id} className="px-4 py-3 hover:bg-white/5 transition">
                                            <div className="flex items-start gap-3">
                                                <img
                                                    src={request.sender.image || '/default-avatar.png'}
                                                    alt={request.sender.name || 'User'}
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-semibold">
                                                        {request.sender.name || 'Anonymous'}
                                                    </p>
                                                    <p className="text-zinc-400 text-xs mt-0.5">
                                                        wants to join "{request.post.title || request.post.content.substring(0, 30) + '...'}"
                                                    </p>
                                                    <div className="flex gap-2 mt-2">
                                                        <button
                                                            onClick={() => handleUpdateJoinRequest(request.id, 'ACCEPTED')}
                                                            disabled={processing === request.id}
                                                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white text-xs px-3 py-1.5 rounded-full transition"
                                                        >
                                                            {processing === request.id ? (
                                                                <Loader2 size={12} className="animate-spin" />
                                                            ) : (
                                                                <>
                                                                    <Check size={12} />
                                                                    <span>Accept</span>
                                                                </>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateJoinRequest(request.id, 'REJECTED')}
                                                            disabled={processing === request.id}
                                                            className="flex items-center gap-1 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white text-xs px-3 py-1.5 rounded-full transition"
                                                        >
                                                            <X size={12} />
                                                            <span>Reject</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
