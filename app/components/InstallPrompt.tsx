'use client'
import { useEffect, useState } from 'react'
import { X, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)

            // Check if user has dismissed before
            const dismissed = localStorage.getItem('pwa-install-dismissed')
            if (!dismissed) {
                setShowPrompt(true)
            }
        }

        window.addEventListener('beforeinstallprompt', handler)

        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        console.log(`User response: ${outcome}`)
        setDeferredPrompt(null)
        setShowPrompt(false)
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem('pwa-install-dismissed', 'true')
    }

    if (!showPrompt) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
            >
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 shadow-2xl">
                    <div className="flex items-start gap-3">
                        <Download className="text-white flex-shrink-0 mt-1" size={24} />
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg">Install JoinMe</h3>
                            <p className="text-white/90 text-sm mt-1">
                                Get the full app experience on your home screen!
                            </p>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={handleInstall}
                                    className="bg-white text-blue-600 px-4 py-2 rounded-full font-semibold text-sm hover:bg-white/90 transition"
                                >
                                    Install
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="text-white px-4 py-2 rounded-full font-semibold text-sm hover:bg-white/10 transition"
                                >
                                    Not Now
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={handleDismiss}
                            className="text-white/80 hover:text-white transition"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
