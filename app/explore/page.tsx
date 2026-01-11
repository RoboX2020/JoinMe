'use client'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Users, Search, UserPlus, Loader2 } from 'lucide-react'
import PostCard from '../components/PostCard'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface Friend {
    id: string
    name: string | null
    email: string | null
    image: string | null
    bio: string | null
}

interface Post {
    id: string
    title: string | null
    content: string
    category: string | null
    price: string | null
    imageUrl: string | null
    latitude: number
    longitude: number
    author: {
        id: string
        name: string | null
        image: string | null
    }
    joinRequests: any[]
    createdAt: string
}

interface SearchUser extends Friend {
    isFriend: boolean
    friendshipStatus?: string | null
}

interface NearbyUser extends Friend {
    distance: number
    friendshipStatus: string | null
}

export default function FindFriendsPage() {
    const { data: session, status } = useSession()
    const [friends, setFriends] = useState<Friend[]>([])
    const [posts, setPosts] = useState<Post[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchUser[]>([])
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([])
    const [allUsers, setAllUsers] = useState<SearchUser[]>([])
    const [loading, setLoading] = useState(false)
    const [addingFriend, setAddingFriend] = useState<string | null>(null)
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null)

    // Get user location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    })
                },
                (error) => console.error('Error getting location:', error)
            )
        }
    }, [])

    // Fetch all users and friends on mount
    useEffect(() => {
        if (status === 'authenticated') {
            fetchFriends()
            fetchAllUsers()
        }
    }, [status])

    // Fetch nearby users when location is available
    useEffect(() => {
        if (userLocation && status === 'authenticated') {
            fetchNearbyUsers()
        }
    }, [userLocation, status])

    // Search users when query changes
    useEffect(() => {
        if (searchQuery.length >= 2) {
            searchUsers()
        } else {
            setSearchResults([])
        }
    }, [searchQuery])

    const fetchFriends = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/friends')
            if (res.ok) {
                const data = await res.json()
                setFriends(data.friends || [])
                setPosts(data.posts || [])
            }
        } catch (error) {
            console.error('Error fetching friends:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchNearbyUsers = async () => {
        if (!userLocation) return
        try {
            const res = await fetch(`/api/users/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=5`)
            if (res.ok) {
                const data = await res.json()
                setNearbyUsers(data)
            }
        } catch (error) {
            console.error('Error fetching nearby users:', error)
        }
    }

    const fetchAllUsers = async () => {
        try {
            const res = await fetch('/api/users')
            if (res.ok) {
                const data = await res.json()
                setAllUsers(data)
            }
        } catch (error) {
            console.error('Error fetching all users:', error)
        }
    }

    const searchUsers = async () => {
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
            if (res.ok) {
                const data = await res.json()
                setSearchResults(data)
            }
        } catch (error) {
            console.error('Error searching users:', error)
        }
    }

    const addFriend = async (email: string, userId: string) => {
        setAddingFriend(userId)
        try {
            const res = await fetch('/api/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendEmail: email }),
            })

            if (res.ok) {
                // Refresh friends list
                await fetchFriends()
                setSearchQuery('')
                setSearchResults([])
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to add friend')
            }
        } catch (error) {
            console.error('Error adding friend:', error)
            alert('Failed to add friend')
        } finally {
            setAddingFriend(null)
        }
    }

    const sendFriendRequest = async (userId: string) => {
        setAddingFriend(userId)
        try {
            const res = await fetch('/api/friends', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendId: userId }),
            })

            if (res.ok) {
                // Refresh nearby users and all users
                await fetchNearbyUsers()
                await fetchAllUsers()
            } else {
                const error = await res.json()
                alert(error.error || 'Failed to send request')
            }
        } catch (error) {
            console.error('Error sending request:', error)
            alert('Failed to send request')
        } finally {
            setAddingFriend(null)
        }
    }
    if (status === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        )
    }

    if (status === 'unauthenticated') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
                <Users size={64} className="text-zinc-600" />
                <h2 className="text-2xl font-bold text-white">Login to Find Friends</h2>
                <p className="text-zinc-400">Connect with your friends and see what they're hosting!</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 pb-24">
            <h1 className="text-3xl font-black text-white pl-2">Find Friends</h1>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-3.5 text-zinc-400" size={20} />
                <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search friends by email or name..."
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />

                {/* Search Results Dropdown */}
                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full mt-2 w-full bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl"
                        >
                            {searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 p-3 hover:bg-white/5 transition"
                                >
                                    <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition">
                                        <img
                                            src={user.image || '/default-avatar.png'}
                                            alt={user.name || 'User'}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white truncate">
                                                {user.name || 'Anonymous'}
                                            </p>
                                            <p className="text-sm text-zinc-400 truncate">{user.email}</p>
                                        </div>
                                    </Link>
                                    {user.isFriend ? (
                                        <span className="text-xs text-green-400 font-semibold">Friends ✓</span>
                                    ) : (
                                        <button
                                            onClick={() => addFriend(user.email!, user.id)}
                                            disabled={addingFriend === user.id}
                                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white text-sm px-3 py-1.5 rounded-full transition"
                                        >
                                            {addingFriend === user.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <UserPlus size={14} />
                                                    <span>Add</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Friends Count */}
            <div className="flex items-center gap-2 text-zinc-400 text-sm pl-2">
                <Users size={16} />
                <span>{friends.length} friend{friends.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Nearby Users Section */}
            {nearbyUsers.length > 0 && (
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-bold text-white pl-2">Nearby People</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {nearbyUsers.map((user) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition">
                                        <img
                                            src={user.image || '/default-avatar.png'}
                                            alt={user.name || 'User'}
                                            className="w-12 h-12 rounded-full object-cover"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-white truncate">
                                                {user.name || 'Anonymous'}
                                            </p>
                                            <p className="text-sm text-zinc-400">
                                                {user.distance < 1
                                                    ? `${(user.distance * 1000).toFixed(0)}m away`
                                                    : `${user.distance.toFixed(1)}km away`
                                                }
                                            </p>
                                        </div>
                                    </Link>
                                    {user.friendshipStatus === 'ACCEPTED' ? (
                                        <span className="text-xs text-green-400 font-semibold">Friends ✓</span>
                                    ) : user.friendshipStatus === 'PENDING' ? (
                                        <span className="text-xs text-yellow-400 font-semibold">Pending</span>
                                    ) : (
                                        <button
                                            onClick={() => sendFriendRequest(user.id)}
                                            disabled={addingFriend === user.id}
                                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white text-sm px-3 py-1.5 rounded-full transition"
                                        >
                                            {addingFriend === user.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <UserPlus size={14} />
                                                    <span>Add</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )
            }

            {/* All Users Section */}
            {
                allUsers.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold text-white pl-2">All Users on Platform</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {allUsers.slice(0, 20).map((user) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition">
                                            <img
                                                src={user.image || '/default-avatar.png'}
                                                alt={user.name || 'User'}
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-white truncate">
                                                    {user.name || 'Anonymous'}
                                                </p>
                                                <p className="text-sm text-zinc-400 truncate">{user.email}</p>
                                            </div>
                                        </Link>
                                        {user.isFriend ? (
                                            <span className="text-xs text-green-400 font-semibold">Friends ✓</span>
                                        ) : user.friendshipStatus === 'PENDING' ? (
                                            <span className="text-xs text-yellow-400 font-semibold">Pending</span>
                                        ) : (
                                            <button
                                                onClick={() => sendFriendRequest(user.id)}
                                                disabled={addingFriend === user.id}
                                                className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 text-white text-sm px-3 py-1.5 rounded-full transition"
                                            >
                                                {addingFriend === user.id ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <UserPlus size={14} />
                                                        <span>Add</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div >
                )
            }

            {/* Loading State */}
            {
                loading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                )
            }

            {/* Friends' Posts */}
            {
                !loading && posts.length > 0 && (
                    <div className="flex flex-col gap-4">
                        <h2 className="text-xl font-bold text-white pl-2">Friends' Activities</h2>
                        {posts.map((post) => (
                            <PostCard key={post.id} post={post} />
                        ))}
                    </div>
                )
            }

            {/* No Posts Message */}
            {
                !loading && posts.length === 0 && friends.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                        <div className="text-zinc-600">
                            <Users size={48} />
                        </div>
                        <p className="text-zinc-400">Your friends haven't posted any events yet.</p>
                        <p className="text-zinc-500 text-sm">Check back later!</p>
                    </div>
                )
            }

            {/* No Friends Message */}
            {
                !loading && friends.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                        <div className="text-zinc-600">
                            <UserPlus size={48} />
                        </div>
                        <p className="text-zinc-400">You haven't added any friends yet.</p>
                        <p className="text-zinc-500 text-sm">Search above to find and add friends!</p>
                    </div>
                )
            }
        </div >
    )
}
