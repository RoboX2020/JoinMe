'use client'
import { motion } from 'framer-motion';
import { MapPin, Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';
import { formatMessageTime, getGoogleMapsUrl, getMapboxStaticUrl } from '@/lib/messageUtils';

interface MessageBubbleProps {
    message: {
        id: string;
        content: string;
        senderId: string;
        createdAt: string;
        type?: string;
        imageUrl?: string | null;
        latitude?: number | null;
        longitude?: number | null;
        status?: 'sending' | 'sent' | 'failed';
    };
    isOwn: boolean;
    showAvatar?: boolean;
    onImageClick?: (imageUrl: string) => void;
}

export default function MessageBubble({
    message,
    isOwn,
    showAvatar = true,
    onImageClick
}: MessageBubbleProps) {
    const renderMessageContent = () => {
        // Image message
        if (message.type === 'image' && message.imageUrl) {
            return (
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="cursor-pointer"
                    onClick={() => onImageClick?.(message.imageUrl!)}
                >
                    <img
                        src={message.imageUrl}
                        alt="Shared image"
                        className="rounded-2xl max-w-xs w-full h-auto shadow-lg"
                        loading="lazy"
                    />
                </motion.div>
            );
        }

        // Location message
        if (message.type === 'location' && message.latitude && message.longitude) {
            return (
                <a
                    href={getGoogleMapsUrl(message.latitude, message.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block rounded-2xl overflow-hidden ${isOwn ? 'bg-blue-600/20' : 'bg-zinc-800'
                        } hover:opacity-90 transition-opacity`}
                >
                    <img
                        src={getMapboxStaticUrl(message.latitude, message.longitude)}
                        alt="Location"
                        className="w-full h-40 object-cover"
                        loading="lazy"
                    />
                    <div className="p-3">
                        <p className={`text-sm font-semibold flex items-center gap-2 ${isOwn ? 'text-blue-400' : 'text-blue-400'
                            }`}>
                            <MapPin size={14} />
                            View on Maps
                        </p>
                    </div>
                </a>
            );
        }

        // Text message
        return (
            <div className={`px-4 py-2.5 rounded-3xl ${isOwn
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-zinc-800 text-white rounded-bl-sm'
                }`}>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
            </div>
        );
    };

    const renderStatus = () => {
        if (!isOwn) return null;

        switch (message.status) {
            case 'sending':
                return <Clock size={12} className="text-zinc-500" />;
            case 'failed':
                return <AlertCircle size={12} className="text-red-500" />;
            case 'sent':
                return <Check size={12} className="text-zinc-500" />;
            default:
                return <CheckCheck size={12} className="text-blue-400" />;
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}
        >
            <div className={`max-w-[75%] flex flex-col gap-1 ${isOwn ? 'items-end' : 'items-start'}`}>
                {renderMessageContent()}

                <div className="flex items-center gap-1.5 px-2">
                    <span className="text-xs text-zinc-500">
                        {formatMessageTime(message.createdAt)}
                    </span>
                    {renderStatus()}
                </div>
            </div>
        </motion.div>
    );
}
