/**
 * Message utility functions for formatting and grouping
 */

export interface Message {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    createdAt: string;
    type?: string;
    imageUrl?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    status?: 'sending' | 'sent' | 'failed';
}

export interface MessageGroup {
    date: string;
    messages: Message[];
}

/**
 * Format timestamp to readable format
 */
export function formatMessageTime(timestamp: string | Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format date for message grouping
 */
export function formatMessageDate(timestamp: string | Date): string {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to midnight for comparison
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    const messageDate = new Date(date);
    messageDate.setHours(0, 0, 0, 0);

    if (messageDate.getTime() === today.getTime()) {
        return 'Today';
    } else if (messageDate.getTime() === yesterday.getTime()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    }
}

/**
 * Group messages by date
 */
export function groupMessagesByDate(messages: Message[]): MessageGroup[] {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
        const dateKey = formatMessageDate(message.createdAt);
        if (!groups[dateKey]) {
            groups[dateKey] = [];
        }
        groups[dateKey].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
        date,
        messages,
    }));
}

/**
 * Check if two messages are from the same sender and close in time
 */
export function shouldGroupMessages(msg1: Message, msg2: Message, maxMinutes: number = 5): boolean {
    if (msg1.senderId !== msg2.senderId) return false;

    const time1 = new Date(msg1.createdAt).getTime();
    const time2 = new Date(msg2.createdAt).getTime();
    const diffMinutes = Math.abs(time2 - time1) / 1000 / 60;

    return diffMinutes <= maxMinutes;
}

/**
 * Get message preview text
 */
export function getMessagePreview(message: Message): string {
    switch (message.type) {
        case 'image':
            return '📷 Photo';
        case 'location':
            return '📍 Location';
        default:
            return message.content;
    }
}

/**
 * Generate Google Maps URL for location
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Generate Mapbox static map URL
 */
export function getMapboxStaticUrl(
    lat: number,
    lng: number,
    width: number = 300,
    height: number = 200,
    zoom: number = 14
): string {
    // Using public Mapbox token (for demo purposes)
    const token = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcm1zN3gifQ.rJcFIG214AriISLbB6B5aw';

    return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+3b82f6(${lng},${lat})/${lng},${lat},${zoom},0/${width}x${height}@2x?access_token=${token}`;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generate unique temporary ID for optimistic updates
 */
export function generateTempId(): string {
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
