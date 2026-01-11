import api from './api';

export const postsService = {
    getPosts: async (lat: number, lng: number) => {
        const response = await api.get(`/posts?lat=${lat}&lng=${lng}`);
        return response.data;
    },

    createPost: async (data: {
        title?: string;
        content: string;
        category?: string;
        price?: string;
        imageUrl?: string;
        latitude: number;
        longitude: number;
    }) => {
        const response = await api.post('/posts', data);
        return response.data;
    },

    joinPost: async (postId: string) => {
        const response = await api.post('/join-requests', { postId });
        return response.data;
    },
};
