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

    const fetchPosts = useCallback(() => {
        fetch(`/api/posts?lat=${location.lat}&lng=${location.lng}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPosts(data)
            })
            .catch(console.error)
    }, [location])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts, refreshTrigger])

    // Auto-refresh every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchPosts()
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
