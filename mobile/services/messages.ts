import api from './api';

export const messagesService = {
    getConversations: async () => {
        const response = await api.get('/messages');
        return response.data;
    },

    getMessages: async (userId: string) => {
        const response = await api.get(`/messages/${userId}`);
        return response.data;
    },

    sendMessage: async (data: {
        receiverId: string;
        content: string;
        type: 'text' | 'image' | 'location';
        imageUrl?: string;
        latitude?: number;
        longitude?: number;
    }) => {
        const response = await api.post('/messages', data);
        return response.data;
    },
};
