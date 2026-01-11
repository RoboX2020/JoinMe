import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/auth';
import { getToken, deleteToken } from '../services/api';

interface User {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
}

interface AuthContextData {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    async function loadUser() {
        try {
            const token = await getToken();
            if (token) {
                const userData = await authService.getCurrentUser();
                setUser(userData);
            }
        } catch (error) {
            console.error('Failed to load user:', error);
            await deleteToken();
        } finally {
            setLoading(false);
        }
    }

    async function login(email: string, password: string) {
        const data = await authService.login({ email, password });
        setUser(data.user);
    }

    async function register(name: string, email: string, password: string) {
        const data = await authService.register({ name, email, password });
        setUser(data.user);
    }

    async function logout() {
        await authService.logout();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
