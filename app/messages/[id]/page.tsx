'use client'
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from '@/app/components/MessageBubble';
import MessageInput from '@/app/components/MessageInput';
import ImageLightbox from '@/app/components/ImageLightbox';
import { generateTempId, groupMessagesByDate, type Message } from '@/lib/messageUtils';
import { compressImage } from '@/lib/imageUtils';

interface ChatMessage extends Message {
    sender?: {
        name: string | null;
        image: string | null;
    };
}

interface UserInfo {
    id: string;
    name: string | null;
    image: string | null;
    email: string | null;
}

export default function ChatPage() {
    const { id: otherUserId } = useParams();
    const router = useRouter();
    const { data: session } = useSession();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [otherUser, setOtherUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    // @ts-ignore - NextAuth session typing issue  
    const myId = session?.user?.id as string;
    const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageTimeRef = useRef<string | null>(null);

    // Fetch messages and other user info
    const fetchMessages = useCallback(async (isInitial = false) => {
        if (!myId || !otherUserId) return;

        try {
            // For initial load, fetch last 50 messages
            // For polling, only fetch messages newer than the last one we have
            let url = `/api/messages/${otherUserId}`;

            if (!isInitial && lastMessageTimeRef.current) {
                // Incremental update - only new messages
                url += `?since=${lastMessageTimeRef.current}`;
            } else {
                // Initial load - get 50 most recent
                url += `?take=50`;
            }

            const res = await fetch(url);

            if (!res.ok) {
                throw new Error('Failed to fetch messages');
            }

            const data = await res.json();

            if (Array.isArray(data) && data.length > 0) {
                const formattedMessages = data.reverse().map((msg: any) => ({
                    ...msg,
                    status: 'sent'
                }));

                if (isInitial) {
                    // Initial load - replace all messages
                    setMessages(formattedMessages);
                    // Update timestamp to latest message
                    lastMessageTimeRef.current = data[0].createdAt;
                } else {
                    // Incremental update - append new messages
                    setMessages(prev => [...prev, ...formattedMessages]);
                    // Update timestamp to latest message
                    if (data[0]) {
                        lastMessageTimeRef.current = data[0].createdAt;
                    }
                }
            }
        } catch (err) {
            console.error('Fetch error:', err);
            if (isInitial) {
                setError('Failed to load messages');
            }
        } finally {
            if (isInitial) {
                setLoading(false);
            }
        }
    }, [myId, otherUserId]);

    // Fetch other user info
    useEffect(() => {
        if (!otherUserId) return;

        fetch(`/api/users/${otherUserId}`)
            .then(r => r.json())
            .then(user => {
                setOtherUser(user);
            })
            .catch(err => {
                console.error('Error fetching user:', err);
            });
    }, [otherUserId]);

    // Page visibility detection
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden)
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [])

    // Initial fetch and polling
    useEffect(() => {
        if (!myId || !otherUserId || !isVisible) return;

        // Initial load
        fetchMessages(true);

        // Poll for new messages every 5 seconds (reduced from 3s, only when visible)
        fetchIntervalRef.current = setInterval(() => {
            fetchMessages(false); // Incremental poll
        }, 5000);

        return () => {
            if (fetchIntervalRef.current) {
                clearInterval(fetchIntervalRef.current);
            }
        };
    }, [myId, otherUserId, fetchMessages, isVisible]);

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Send text message with optimistic update
    const handleSendText = async (text: string) => {
        if (!text.trim() || !myId || !otherUserId) return;

        const tempId = generateTempId();
        const tempMessage: ChatMessage = {
            id: tempId,
            content: text,
            senderId: myId,
            receiverId: otherUserId as string,
            createdAt: new Date().toISOString(),
            type: 'text',
            status: 'sending'
        };

        // Optimistic update
        setMessages(prev => [...prev, tempMessage]);

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: otherUserId,
                    content: text,
                    type: 'text'
                })
            });

            if (!res.ok) {
                throw new Error('Failed to send message');
            }

            const sentMessage = await res.json();

            // Replace temp message with real one
            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? { ...sentMessage, status: 'sent' } : msg
            ));
        } catch (err) {
            console.error('Send error:', err);

            // Mark as failed
            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? { ...msg, status: 'failed' } : msg
            ));

            alert('Failed to send message. Please try again.');
        }
    };

    // Send image with compression and optimistic update
    const handleSendImage = async (imageDataUrl: string) => {
        if (!myId || !otherUserId) return;

        const tempId = generateTempId();
        const tempMessage: ChatMessage = {
            id: tempId,
            content: '📷 Photo',
            senderId: myId,
            receiverId: otherUserId as string,
            createdAt: new Date().toISOString(),
            type: 'image',
            imageUrl: imageDataUrl,
            status: 'sending'
        };

        // Optimistic update
        setMessages(prev => [...prev, tempMessage]);

        try {
            // Compress image first
            const compressedUrl = await compressImage(
                await (await fetch(imageDataUrl)).blob() as File,
                { maxWidth: 1920, maxHeight: 1080, quality: 0.8 }
            );

            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiverId: otherUserId,
                    content: '📷 Photo',
                    type: 'image',
                    imageUrl: compressedUrl
                })
            });

            if (!res.ok) {
                throw new Error('Failed to send image');
            }

            const sentMessage = await res.json();

            // Replace temp message with real one
            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? { ...sentMessage, status: 'sent' } : msg
            ));
        } catch (err) {
            console.error('Image send error:', err);

            // Mark as failed
            setMessages(prev => prev.map(msg =>
                msg.id === tempId ? { ...msg, status: 'failed' } : msg
            ));

            alert('Failed to send image. Please try again.');
        }
    };

    // Send location with optimistic update
    const handleSendLocation = async () => {
        if (!navigator.geolocation || gettingLocation || !myId || !otherUserId) return;

        setGettingLocation(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                const tempId = generateTempId();

                const tempMessage: ChatMessage = {
                    id: tempId,
                    content: '📍 Location',
                    senderId: myId,
                    receiverId: otherUserId as string,
                    createdAt: new Date().toISOString(),
                    type: 'location',
                    latitude,
                    longitude,
                    status: 'sending'
                };

                // Optimistic update
                setMessages(prev => [...prev, tempMessage]);
                setGettingLocation(false);

                try {
                    const res = await fetch('/api/messages', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            receiverId: otherUserId,
                            content: '📍 Location',
                            type: 'location',
                            latitude,
                            longitude
                        })
                    });

                    if (!res.ok) {
                        throw new Error('Failed to send location');
                    }

                    const sentMessage = await res.json();

                    // Replace temp message with real one
                    setMessages(prev => prev.map(msg =>
                        msg.id === tempId ? { ...sentMessage, status: 'sent' } : msg
                    ));
                } catch (err) {
                    console.error('Location send error:', err);

                    // Mark as failed
                    setMessages(prev => prev.map(msg =>
                        msg.id === tempId ? { ...msg, status: 'failed' } : msg
                    ));

                    alert('Failed to send location. Please try again.');
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setGettingLocation(false);

                let errorMsg = 'Could not get your location.';
                if (err.code === err.PERMISSION_DENIED) {
                    errorMsg = 'Location access denied. Please enable location services.';
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    errorMsg = 'Location information unavailable.';
                } else if (err.code === err.TIMEOUT) {
                    errorMsg = 'Location request timed out.';
                }

                alert(errorMsg);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    if (!session) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black text-white">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    const messageGroups = groupMessagesByDate(messages);

    return (
        <div className="fixed inset-0 flex flex-col bg-black text-white z-[100]">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-4 bg-zinc-900 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/messages')}
                        className="hover:bg-white/10 p-2 rounded-full transition-colors"
                        aria-label="Back to messages"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    {otherUser && (
                        <Link
                            href={`/profile/${otherUserId}`}
                            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <img
                                src={otherUser.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`}
                                className="w-10 h-10 rounded-full object-cover border border-white/10"
                                alt={otherUser.name || 'User'}
                            />
                            <div>
                                <span className="font-bold block">{otherUser.name || 'User'}</span>
                                {otherUser.email && (
                                    <span className="text-xs text-zinc-400">{otherUser.email}</span>
                                )}
                            </div>
                        </Link>
                    )}
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                ) : error ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-red-500 mb-2">{error}</p>
                            <button
                                onClick={fetchMessages}
                                className="text-blue-500 hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-zinc-500">
                            <p className="mb-2">No messages yet</p>
                            <p className="text-sm">Send a message to start the conversation!</p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {messageGroups.map((group) => (
                            <div key={group.date} className="space-y-2">
                                {/* Date Header */}
                                <div className="flex justify-center my-4">
                                    <div className="bg-zinc-800/50 px-3 py-1 rounded-full">
                                        <span className="text-xs text-zinc-400 font-medium">{group.date}</span>
                                    </div>
                                </div>

                                {/* Messages */}
                                {group.messages.map((msg) => (
                                    <MessageBubble
                                        key={msg.id}
                                        message={msg}
                                        isOwn={msg.senderId === myId}
                                        onImageClick={setLightboxImage}
                                    />
                                ))}
                            </div>
                        ))}
                    </AnimatePresence>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <MessageInput
                onSendText={handleSendText}
                onSendImage={handleSendImage}
                onSendLocation={handleSendLocation}
                gettingLocation={gettingLocation}
            />

            {/* Image Lightbox */}
            <ImageLightbox
                imageUrl={lightboxImage}
                onClose={() => setLightboxImage(null)}
            />
        </div>
    );
}
