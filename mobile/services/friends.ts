import api from './api';

export const friendsService = {
    getFriends: async () => {
        const response = await api.get('/friends');
        return response.data;
    },

    searchUsers: async (query: string) => {
        const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
        return response.data;
    },

    getNearbyUsers: async (lat: number, lng: number, radius: number = 5) => {
        const response = await api.get(`/users/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
        return response.data;
    },

    sendFriendRequest: async (friendId: string) => {
        const response = await api.post('/friends', { friendId });
        return response.data;
    },

    acceptFriendRequest: async (friendshipId: string) => {
        const response = await api.put(`/friends/${friendshipId}`);
        return response.data;
    },

    rejectFriendRequest: async (friendshipId: string) => {
        const response = await api.delete(`/friends/${friendshipId}`);
        return response.data;
    },
};
