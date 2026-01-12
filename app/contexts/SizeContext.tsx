'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type InterfaceSize = 'small' | 'normal' | 'large';

interface SizeContextType {
    size: InterfaceSize;
    setSize: (size: InterfaceSize) => void;
}

const SizeContext = createContext<SizeContextType | undefined>(undefined);

export function SizeProvider({ children }: { children: React.ReactNode }) {
    const [size, setSizeState] = useState<InterfaceSize>('normal');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load size preference from localStorage
        const savedSize = localStorage.getItem('interface-size') as InterfaceSize;
        if (savedSize && ['small', 'normal', 'large'].includes(savedSize)) {
            setSizeState(savedSize);
            applySize(savedSize);
        }
    }, []);

    const setSize = (newSize: InterfaceSize) => {
        setSizeState(newSize);
        localStorage.setItem('interface-size', newSize);
        applySize(newSize);
    };

    const applySize = (sizeValue: InterfaceSize) => {
        // Apply size as data attribute on document root
        if (typeof document !== 'undefined') {
            document.documentElement.setAttribute('data-size', sizeValue);
        }
    };

    // Prevent hydration mismatch
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <SizeContext.Provider value={{ size, setSize }}>
            {children}
        </SizeContext.Provider>
    );
}

export function useSize() {
    const context = useContext(SizeContext);
    if (context === undefined) {
        throw new Error('useSize must be used within a SizeProvider');
    }
    return context;
}
