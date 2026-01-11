import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://join-me-project-ten.vercel.app/api';

// Auth token management
export const saveToken = async (token: string) => {
    await SecureStore.setItemAsync('authToken', token);
};

export const getToken = async () => {
    return await SecureStore.getItemAsync('authToken');
};

export const deleteToken = async () => {
    await SecureStore.deleteItemAsync('authToken');
};

// Create axios instance with auth header
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
