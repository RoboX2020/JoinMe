'use client'
import { useState, useRef } from 'react'
import { Image as ImageIcon, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'

export default function PostComposer({ location, onPostCreated }: { location: { lat: number, lng: number }, onPostCreated: () => void }) {
    const { data: session } = useSession()
    const [content, setContent] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const removeImage = () => {
        setImageFile(null)
        setImagePreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return

        setLoading(true)
        try {
            // Auto-generate title from first 50 chars of content
            const autoTitle = content.trim().substring(0, 50) + (content.length > 50 ? '...' : '')

            // For now, just send the post without image upload
            // In production, you'd upload to a service like Cloudinary
            await fetch('/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: autoTitle,
                    content,
                    imageUrl: imagePreview, // In production, replace with uploaded URL
                    lat: location.lat,
                    lng: location.lng,
                    category: 'General',
                    price: 'Free'
                }),
            })
            setContent('')
            setImageFile(null)
            setImagePreview(null)
            onPostCreated()
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    if (!session) return null

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-4 backdrop-blur-xl"
        >
            <form onSubmit={handleSubmit}>
                <div className="flex gap-3">
                    {/* User Avatar */}
                    <img
                        src={session.user?.image || '/default-avatar.png'}
                        alt="You"
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />

                    {/* Input Area */}
                    <div className="flex-1">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="What's happening nearby?"
                            className="w-full bg-transparent text-white placeholder-zinc-500 text-lg resize-none focus:outline-none min-h-[60px] max-h-[200px]"
                            rows={2}
                        />

                        {/* Image Preview */}
                        <AnimatePresence>
                            {imagePreview && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 relative rounded-2xl overflow-hidden"
                                >
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-auto max-h-64 object-cover rounded-2xl"
                                    />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 bg-black/70 text-white p-1.5 rounded-full hover:bg-black transition"
                                    >
                                        <X size={16} />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Actions */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-blue-400 hover:bg-blue-400/10 p-2 rounded-full transition"
                            >
                                <ImageIcon size={20} />
                            </button>

                            <button
                                type="submit"
                                disabled={!content.trim() || loading}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white px-5 py-2 rounded-full font-bold transition flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    'Post'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </motion.div>
    )
}
