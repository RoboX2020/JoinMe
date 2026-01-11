'use client'
import { useEffect, useState } from 'react'
import { Bell, X, Check, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function RequestList() {
    const [requests, setRequests] = useState<any[]>([])
    const [open, setOpen] = useState(false)

    const fetchRequests = () => {
        fetch('/api/join-requests')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setRequests(data)
            })
    }

    useEffect(() => {
        fetchRequests()
        const interval = setInterval(fetchRequests, 5000)
        return () => clearInterval(interval)
    }, [])

    const handleAction = async (requestId: string, status: string) => {
        await fetch('/api/join-requests', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId, status })
        })
        fetchRequests()
    }

    if (requests.length === 0) return null

    return (
        <>
            {/* Bell Trigger */}
            <motion.button
                onClick={() => setOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed top-5 right-5 z-50 bg-red-500 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg pointer-events-auto"
            >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 bg-white text-red-600 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-red-500">
                    {requests.length}
                </span>
            </motion.button>

            {/* Backdrop */}
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 pointer-events-auto"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 20 }}
                            className="fixed top-0 right-0 bottom-0 w-80 bg-background border-l border-border z-50 shadow-2xl flex flex-col pointer-events-auto"
                        >
                            <div className="p-4 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-md sticky top-0">
                                <h3 className="font-bold text-lg">Join Requests</h3>
                                <button onClick={() => setOpen(false)} className="p-2 hover:bg-muted rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {requests.map(req => (
                                    <motion.div
                                        layout
                                        key={req.id}
                                        className="p-4 rounded-2xl bg-card border border-border shadow-sm"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-muted overflow-hidden">
                                                <img src={req.sender.image || '/default-avatar.png'} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <span className="font-bold block text-sm">{req.sender.name}</span>
                                                <span className="text-xs text-muted-foreground">wants to join</span>
                                            </div>
                                        </div>

                                        <div className="bg-muted/50 p-2 rounded-lg mb-3 text-xs font-medium italic border-l-2 border-accent">
                                            "{req.post.content.substring(0, 50)}..."
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAction(req.id, 'ACCEPTED')}
                                                className="flex-1 bg-black dark:bg-white text-white dark:text-black py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 hover:opacity-90"
                                            >
                                                <Check size={14} /> Accept
                                            </button>
                                            <button
                                                onClick={() => handleAction(req.id, 'REJECTED')}
                                                className="flex-1 bg-muted text-muted-foreground py-2 rounded-xl text-xs font-bold hover:bg-muted/80"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}
