'use client'
import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function ChatPage() {
    const { id: otherUserId } = useParams()
    const { data: session } = useSession()
    const [messages, setMessages] = useState<any[]>([])
    const [newMessage, setNewMessage] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)
    const [otherUser, setOtherUser] = useState<any>(null)

    // Fetch user details
    useEffect(() => {
        if (otherUserId) {
            fetch(`/api/users?id=${otherUserId}`)
                .then(res => res.json())
                .then(data => setOtherUser(data))
        }
    }, [otherUserId])

    // Poll for messages
    useEffect(() => {
        const fetchMessages = () => {
            fetch(`/api/messages/${otherUserId}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) setMessages(data)
                })
        }

        fetchMessages()
        const interval = setInterval(fetchMessages, 3000)
        return () => clearInterval(interval)
    }, [otherUserId])

    // Scroll to bottom on new message
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        await fetch('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ receiverId: otherUserId, content: newMessage })
        })
        setNewMessage('')
        // Immediate fetch to update UI
        fetch(`/api/messages/${otherUserId}`).then(res => res.json()).then(setMessages)
    }

    // @ts-ignore
    const myId = session?.user?.id;

    return (
        <div className="flex flex-col h-[calc(100vh-160px)]">
            <div className="card mb-4 flex items-center gap-2 sticky top-0 z-10">
                {otherUser && (
                    <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={otherUser.image || '/default-avatar.png'} className="avatar" style={{ width: '32px', height: '32px' }} />
                        <span className="font-bold">{otherUser.name}</span>
                    </>
                )}
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 p-2" style={{ paddingBottom: '1rem' }}>
                {messages.map(msg => {
                    const isMe = msg.senderId === myId
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div style={{
                                maxWidth: '75%',
                                padding: '0.5rem 1rem',
                                borderRadius: '1rem',
                                backgroundColor: isMe ? 'var(--primary)' : 'var(--border)',
                                color: isMe ? 'white' : 'var(--foreground)',
                                fontSize: '0.9rem'
                            }}>
                                {msg.content}
                            </div>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={sendMessage} className="flex gap-2 mt-2" style={{ position: 'sticky', bottom: 0, background: 'var(--background)', padding: '0.5rem' }}>
                <input
                    className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    style={{ background: 'var(--card-bg)', color: 'var(--foreground)' }}
                />
                <button type="submit" className="btn-primary" disabled={!newMessage.trim()}>Send</button>
            </form>
        </div>
    )
}
