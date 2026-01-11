'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, MessageCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SearchUser {
    id: string
    name: string | null
    email: string | null
    image: string | null
    isFriend: boolean
}

export default function MessagesPage() {
    const [conversations, setConversations] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SearchUser[]>([])
    const [searching, setSearching] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetch('/api/messages')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setConversations(data)
            })
    }, [])

    useEffect(() => {
        if (searchQuery.length >= 2) {
            searchUsers()
        } else {
            setSearchResults([])
        }
    }, [searchQuery])

    const searchUsers = async () => {
        setSearching(true)
        try {
            const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
            if (res.ok) {
                const data = await res.json()
                setSearchResults(data)
            }
        } catch (error) {
            console.error('Error searching users:', error)
        } finally {
            setSearching(false)
        }
    }

    const handleMessageUser = (userId: string) => {
        setSearchQuery('')
        setSearchResults([])
        router.push(`/messages/${userId}`)
    }

    return (
        <div className="flex flex-col gap-6 w-full">
            <h1 className="text-3xl font-black tracking-tight" style={{ letterSpacing: '-0.03em' }}>
                Messages
            </h1>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-3.5 text-zinc-400" size={20} />
                <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search people to message..."
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                {/* Search Results Dropdown */}
                <AnimatePresence>
                    {searchResults.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full mt-2 w-full bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden z-20 shadow-2xl max-h-80 overflow-y-auto"
                        >
                            {searchResults.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center gap-3 p-3 hover:bg-white/5 transition"
                                >
                                    <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80">
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
                                    <button
                                        onClick={() => handleMessageUser(user.id)}
                                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-full transition shrink-0"
                                    >
                                        <MessageCircle size={16} />
                                        <span>Message</span>
                                    </button>
                                </div>
                            ))}
                        </motion.div>
                    )}
                    {searching && searchQuery.length >= 2 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute top-full mt-2 w-full bg-zinc-900 border border-white/10 rounded-2xl p-4 flex items-center justify-center"
                        >
                            <Loader2 className="animate-spin text-blue-500" size={24} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex flex-col gap-3">
                {conversations.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground bg-muted rounded-[2rem] border border-border">
                        No conversations yet. Search for someone above to start chatting!
                    </div>
                ) : (
                    conversations.map((conv, i) => (
                        <Link key={conv.user.id} href={`/messages/${conv.user.id}`} className="block group">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-[2rem] bg-card border border-border group-hover:bg-muted transition-colors flex items-center gap-4 shadow-sm"
                            >
                                <div className="w-14 h-14 rounded-full bg-muted overflow-hidden border border-border">
                                    <img src={conv.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.user.id}`} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-bold text-lg">{conv.user.name}</span>
                                        <span className="text-xs font-semibold text-muted-foreground">{new Date(conv.timestamp).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-muted-foreground text-sm truncate pr-4 font-medium">
                                        {conv.lastMessage}
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
