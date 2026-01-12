'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPWAProps {
    variant?: 'banner' | 'button';
    onDismiss?: () => void;
}

export default function InstallPWA({ variant = 'button', onDismiss }: InstallPWAProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setIsInstallable(false);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        // If the browser triggered the 'beforeinstallprompt' event, use it
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setIsInstallable(false);
            }
            return;
        }

        // Fallback: Show manual instructions if prompt isn't available
        // (This happens on iOS, or if the user is already on PWA, or browser doesn't support it)
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

        if (isIOS) {
            alert("To install on iOS:\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap 'Add to Home Screen'");
        } else {
            alert("To install:\nLook for the 'Install' icon in your browser's address bar (right side).\n\nOR\n\nTap the browser menu (⋮) -> 'Install App' or 'Add to Home screen'.");
        }
    };

    // Always render the button (don't hide simply because isInstallable is false, 
    // because we want to provide the manual instructions fallback!)
    if (isInstalled) {
        return null;
    }

    if (variant === 'banner') {
        // Only show banner if actually installable (native prompt available) to avoid annoyance
        if (!isInstallable) return null;

        return (
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-3 flex-1">
                    <Download className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Install JoinMe</p>
                        <p className="text-xs opacity-90">Get quick access from your home screen</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleInstallClick}
                        className="bg-white text-blue-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all"
                    >
                        Install
                    </button>
                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="p-1 hover:bg-white/20 rounded-lg transition-all"
                            aria-label="Dismiss"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    // Button variant (Always visible in Settings, acting as trigger or manual help)
    return (
        <button
            onClick={handleInstallClick}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all"
        >
            <Download className="w-5 h-5" />
            <div className="text-left">
                <div className="font-medium">Install App</div>
                <div className="text-xs text-white/80">Get the native app experience</div>
            </div>
        </button>
    );
}
