'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');

    useEffect(() => {
        // Load theme preference from localStorage on client side only
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme && ['dark', 'light'].includes(savedTheme)) {
            setThemeState(savedTheme);
            applyTheme(savedTheme);
        } else {
            // Apply default theme
            applyTheme('dark');
        }
    }, []);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        if (typeof window !== 'undefined') {
            localStorage.setItem('theme', newTheme);
        }
        applyTheme(newTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    };

    const applyTheme = (themeValue: Theme) => {
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-theme', themeValue);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
