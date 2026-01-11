import api, { saveToken, deleteToken } from './api';

interface LoginCredentials {
    email: string;
    password: string;
}

interface RegisterData {
    name: string;
    email: string;
    password: string;
}

export const authService = {
    login: async (credentials: LoginCredentials) => {
        const response = await api.post('/auth/login', credentials);
        if (response.data.token) {
            await saveToken(response.data.token);
        }
        return response.data;
    },

    register: async (data: RegisterData) => {
        const response = await api.post('/register', data);
        if (response.data.token) {
            await saveToken(response.data.token);
        }
        return response.data;
    },

    logout: async () => {
        await deleteToken();
    },

    getCurrentUser: async () => {
        const response = await api.get('/auth/session');
        return response.data.user;
    },
};
