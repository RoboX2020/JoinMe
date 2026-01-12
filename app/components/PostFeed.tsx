'use client'
import { useEffect, useState, useCallback } from 'react'
import PostCard from './PostCard'

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

export default function PostFeed({ location, refreshTrigger }: { location: { lat: number, lng: number }, refreshTrigger: number }) {
    const [posts, setPosts] = useState<Post[]>([])
    const [lastFetchTime, setLastFetchTime] = useState<string | null>(null)
    const [isVisible, setIsVisible] = useState(true)

    const fetchPosts = useCallback((isInitial = false) => {
        let url = `/api/posts?lat=${location.lat}&lng=${location.lng}`

        // For polling (not initial), only fetch new posts
        if (!isInitial && lastFetchTime) {
            url += `&since=${lastFetchTime}`
        } else {
            // Initial load - get 30 most recent posts
            url += `&take=30`
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    if (isInitial) {
                        // Initial load - replace all posts
                        setPosts(data)
                    } else {
                        // Incremental update - prepend new posts
                        setPosts(prev => [...data, ...prev])
                    }
                    // Update last fetch time
                    setLastFetchTime(new Date().toISOString())
                }
            })
            .catch(console.error)
    }, [location, lastFetchTime])

    // Page visibility detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden)
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [])

    // Initial fetch
    useEffect(() => {
        fetchPosts(true)
    }, [location.lat, location.lng, refreshTrigger])

    // Auto-refresh every 10 seconds with incremental updates (only when visible)
    useEffect(() => {
        if (!isVisible) return

        const interval = setInterval(() => {
            fetchPosts(false) // Incremental poll
        }, 10000) // Reduced from 5s to 10s

        return () => clearInterval(interval)
    }, [fetchPosts, isVisible])

    return (
        <div className="flex flex-col gap-8 pb-32 pt-4 px-2">
            {posts.map((post, index) => (
                <PostCard
                    key={post.id}
                    post={post}
                    index={index}
                    onUpdate={fetchPosts}
                />
            ))}
        </div>
    )
}
