'use client'
import { motion } from 'framer-motion'
import { MapPin, MessageCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useState, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Post {
    id: string
    title: string | null
    content: string
    price: string | null
    imageUrl: string | null
    author: { name: string | null, image: string | null, id: string }
    createdAt: string
    joinRequests?: { senderId: string, status: string }[]
}

function PostCard({ post, index = 0, onUpdate }: { post: Post, index?: number, onUpdate?: () => void }) {
    const { data: session } = useSession()
    const router = useRouter()
    const [isJoining, setIsJoining] = useState(false)

    // @ts-ignore
    const myId = session?.user?.id
    const myRequest = post.joinRequests?.find(r => r.senderId === myId)
    const status = myRequest?.status

    const handleJoin = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsJoining(true)
        try {
            await fetch('/api/join-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ postId: post.id })
            })
            if (onUpdate) onUpdate()
        } catch (error) {
            console.error('Error joining:', error)
        } finally {
            setIsJoining(false)
        }
    }, [post.id, onUpdate])

    const handleMessage = useCallback((e: React.MouseEvent) => {
        e.stopPropagation()
        router.push(`/messages/${post.author.id}`)
    }, [router, post.author.id])

    const hasImage = !!post.imageUrl

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="relative group rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/10 shadow-2xl"
        >
            {/* Image Section - Only if image exists */}
            {hasImage ? (
                <div className="aspect-[4/5] relative">
                    <img src={post.imageUrl!} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={post.title || 'Event'} />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />

                    {/* Top Badge */}
                    <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1">
                        <MapPin size={12} className="text-blue-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Nearby</span>
                    </div>

                    {/* Content Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                        {renderContent()}
                    </div>
                </div>
            ) : (
                // Text-only layout
                <div className="p-6">
                    {renderContent()}
                </div>
            )}
        </motion.div>
    )

    function renderContent() {
        return (
            <>
                <div className="flex justify-between items-end mb-3">
                    <h2 className="text-3xl font-black text-white leading-9">{post.title || 'Untitled'}</h2>
                    {post.price && post.price.trim() !== '' && post.price.toLowerCase().trim() !== 'free' && (
                        <div className="bg-blue-600/90 backdrop-blur-md px-4 py-1.5 rounded-full shadow-lg shadow-blue-900/50">
                            <span className="text-sm font-bold text-white">{post.price}</span>
                        </div>
                    )}
                </div>

                <p className="text-zinc-300 text-sm font-medium line-clamp-2 mb-6 leading-relaxed opacity-90">{post.content}</p>

                <div className="flex items-center justify-between">
                    <Link href={`/profile/${post.author.id}`} className="flex items-center gap-3 hover:opacity-80 transition">
                        <div className="w-10 h-10 rounded-full p-0.5 border border-blue-400">
                            <img src={post.author.image || '/default-avatar.png'} className="w-full h-full rounded-full object-cover" alt={post.author.name || 'User'} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-blue-300 font-bold uppercase tracking-wide">Hosted by</span>
                            <span className="text-sm font-bold text-white">{post.author.name || 'Anonymous'}</span>
                        </div>
                    </Link>

                    {post.author.id !== myId && (
                        <div className="flex gap-2">
                            {/* Message Button */}
                            <button
                                onClick={handleMessage}
                                className="h-12 w-12 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-95 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-white"
                            >
                                <MessageCircle size={18} />
                            </button>

                            {/* Join Button */}
                            <button
                                onClick={handleJoin}
                                disabled={status === 'PENDING' || status === 'ACCEPTED' || isJoining}
                                className={`h-12 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-95 flex items-center gap-2 ${status === 'ACCEPTED' ? 'bg-green-500 text-black' :
                                    status === 'PENDING' || isJoining ? 'bg-zinc-800 text-zinc-400 cursor-not-allowed' :
                                        'bg-white text-black hover:bg-blue-50 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                    }`}
                            >
                                {status === 'ACCEPTED' ? 'Joined' : status === 'PENDING' || isJoining ? 'Sent' : 'Join'}
                            </button>
                        </div>
                    )}
                </div>
            </>
        )
    }
}

// Memoize to prevent unnecessary re-renders
export default memo(PostCard)
