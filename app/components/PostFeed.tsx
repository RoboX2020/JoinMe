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

    // Initial fetch
    useEffect(() => {
        fetchPosts(true)
    }, [location.lat, location.lng, refreshTrigger])

    // Auto-refresh every 5 seconds with incremental updates
    useEffect(() => {
        const interval = setInterval(() => {
            fetchPosts(false) // Incremental poll
        }, 5000) // 5 seconds

        return () => clearInterval(interval)
    }, [fetchPosts])

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
