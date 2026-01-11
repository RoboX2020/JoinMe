'use client'
import { useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface ProfileEditFormProps {
    initialData: {
        name?: string | null
        bio?: string | null
        image?: string | null
        profession?: string | null
        location?: string | null
        radiusKm?: number
        accountLinks?: string | null
        interests?: string | null
    }
    onSave: (data: any) => Promise<void>
    onCancel: () => void
}

export default function ProfileEditForm({ initialData, onSave, onCancel }: ProfileEditFormProps) {
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        bio: initialData.bio || '',
        image: initialData.image || '',
        profession: initialData.profession || '',
        location: initialData.location || '',
        radiusKm: initialData.radiusKm || 1.0,
        accountLinks: initialData.accountLinks || '{}',
        interests: initialData.interests || ''
    })

    const [saving, setSaving] = useState(false)
    const [imagePreview, setImagePreview] = useState(initialData.image || '')

    // Parse account links
    const [socialLinks, setSocialLinks] = useState<any>(() => {
        try {
            return JSON.parse(formData.accountLinks)
        } catch {
            return {}
        }
    })

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be less than 2MB')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64String = reader.result as string
            setImagePreview(base64String)
            setFormData(prev => ({ ...prev, image: base64String }))
        }
        reader.readAsDataURL(file)
    }

    const handleSocialLinkChange = (platform: string, value: string) => {
        const updated = { ...socialLinks, [platform]: value }
        setSocialLinks(updated)
        setFormData(prev => ({ ...prev, accountLinks: JSON.stringify(updated) }))
    }

    const handleInterestsChange = (value: string) => {
        setFormData(prev => ({ ...prev, interests: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await onSave(formData)
        } catch (error) {
            console.error('Failed to save:', error)
            alert('Failed to save profile')
        } finally {
            setSaving(false)
        }
    }

    const interestTags = formData.interests
        .split(',')
        .map(i => i.trim())
        .filter(Boolean)

    return (
        <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onSubmit={handleSubmit}
            className="space-y-6"
        >
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/20 bg-zinc-800">
                        <img
                            src={imagePreview || '/default-avatar.png'}
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <label className="absolute bottom-0 right-0 bg-blue-600 p-2 md:p-3 rounded-full cursor-pointer hover:bg-blue-700 transition">
                        <Camera size={16} className="md:w-5 md:h-5 text-white" />
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </label>
                </div>
                <p className="text-xs text-zinc-400">Click camera to upload (max 2MB)</p>
            </div>

            {/* Name */}
            <div>
                <label className="block text-sm font-bold text-white mb-2">Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                />
            </div>

            {/* Bio */}
            <div>
                <label className="block text-sm font-bold text-white mb-2">Bio</label>
                <textarea
                    value={formData.bio}
                    onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    maxLength={500}
                    rows={4}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Tell us about yourself..."
                />
                <p className="text-xs text-zinc-400 mt-1 text-right">{formData.bio.length}/500</p>
            </div>

            {/* Profession */}
            <div>
                <label className="block text-sm font-bold text-white mb-2">Profession / Status</label>
                <input
                    type="text"
                    value={formData.profession}
                    onChange={e => setFormData(prev => ({ ...prev, profession: e.target.value }))}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Student, Software Engineer, Designer"
                />
            </div>

            {/* Location */}
            <div>
                <label className="block text-sm font-bold text-white mb-2">Location</label>
                <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="City, Country"
                />
            </div>

            {/* Finding Radius */}
            <div>
                <label className="block text-sm font-bold text-white mb-2">
                    Finding Radius: {formData.radiusKm.toFixed(1)} km
                </label>
                <input
                    type="range"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={formData.radiusKm}
                    onChange={e => setFormData(prev => ({ ...prev, radiusKm: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>0.5 km</span>
                    <span>50 km</span>
                </div>
            </div>

            {/* Social Links */}
            <div>
                <label className="block text-sm font-bold text-white mb-2">Social Media Links</label>
                <div className="space-y-3">
                    {['twitter', 'instagram', 'linkedin', 'github'].map(platform => (
                        <div key={platform}>
                            <label className="block text-xs text-zinc-400 mb-1 capitalize">{platform}</label>
                            <input
                                type="text"
                                value={socialLinks[platform] || ''}
                                onChange={e => handleSocialLinkChange(platform, e.target.value)}
                                className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder={`Your ${platform} username or URL`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Interests */}
            <div>
                <label className="block text-sm font-bold text-white mb-2">Interests</label>
                <input
                    type="text"
                    value={formData.interests}
                    onChange={e => handleInterestsChange(e.target.value)}
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="hiking, cooking, tech, music (comma-separated)"
                />
                {interestTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {interestTags.map((tag, idx) => (
                            <span
                                key={idx}
                                className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium border border-blue-500/30"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>
            </div>
        </motion.form>
    )
}
