'use client'
import { useState, useRef, KeyboardEvent } from 'react';
import { Send, Image as ImageIcon, MapPin, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
    onSendText: (text: string) => Promise<void>;
    onSendImage: (imageDataUrl: string) => Promise<void>;
    onSendLocation: () => Promise<void>;
    disabled?: boolean;
    gettingLocation?: boolean;
}

export default function MessageInput({
    onSendText,
    onSendImage,
    onSendLocation,
    disabled = false,
    gettingLocation = false
}: MessageInputProps) {
    const [input, setInput] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [sending, setSending] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (imagePreview) {
            await handleSendImage();
        } else if (input.trim()) {
            await handleSendText();
        }
    };

    const handleSendText = async () => {
        const text = input.trim();
        if (!text || disabled) return;

        setInput('');
        setSending(true);

        try {
            await onSendText(text);
        } catch (error) {
            console.error('Send error:', error);
            setInput(text); // Restore input on error
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleSendImage = async () => {
        if (!imagePreview || disabled) return;

        setSending(true);
        try {
            await onSendImage(imagePreview);
            setImagePreview(null);
        } catch (error) {
            console.error('Image send error:', error);
        } finally {
            setSending(false);
        }
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be under 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Reset file input
        e.target.value = '';
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <div className="p-4 bg-zinc-900 border-t border-white/10">
            {/* Image Preview */}
            <AnimatePresence>
                {imagePreview && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mb-3 relative inline-block"
                    >
                        <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-32 rounded-xl border border-white/10"
                        />
                        <button
                            onClick={() => setImagePreview(null)}
                            className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
                            aria-label="Remove image"
                        >
                            <X size={14} className="text-white" />
                        </button>
                        <button
                            onClick={handleSendImage}
                            disabled={sending || disabled}
                            className="mt-2 ml-0 block bg-blue-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {sending && <Loader2 size={14} className="animate-spin" />}
                            Send Photo
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-zinc-800 p-2 rounded-full">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageSelect}
                    accept="image/*"
                    className="hidden"
                />

                {/* Image Button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                    aria-label="Attach image"
                >
                    <ImageIcon size={20} className="text-zinc-400" />
                </button>

                {/* Location Button */}
                <button
                    type="button"
                    onClick={onSendLocation}
                    disabled={gettingLocation || disabled}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
                    aria-label="Share location"
                >
                    {gettingLocation ? (
                        <Loader2 size={20} className="text-blue-400 animate-spin" />
                    ) : (
                        <MapPin size={20} className="text-zinc-400" />
                    )}
                </button>

                {/* Text Input */}
                <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Message..."
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-zinc-500"
                    disabled={sending || disabled}
                />

                {/* Send Button */}
                <button
                    type="submit"
                    disabled={(!input.trim() && !imagePreview) || sending || disabled}
                    className="bg-blue-600 p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                >
                    {sending ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </form>
        </div>
    );
}
