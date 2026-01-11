'use client'
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

interface ImageLightboxProps {
    imageUrl: string | null;
    onClose: () => void;
}

export default function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (imageUrl) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [imageUrl, onClose]);

    const handleDownload = () => {
        if (!imageUrl) return;

        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `image-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <AnimatePresence>
            {imageUrl && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-sm"
                    onClick={onClose}
                >
                    {/* Controls */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDownload();
                            }}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            aria-label="Download image"
                        >
                            <Download size={20} className="text-white" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            aria-label="Close"
                        >
                            <X size={20} className="text-white" />
                        </button>
                    </div>

                    {/* Image */}
                    <motion.img
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        src={imageUrl}
                        alt="Full size"
                        className="max-w-[90vw] max-h-[90vh] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {/* Close hint */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                        <p className="text-sm text-zinc-400">Press ESC or click outside to close</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
