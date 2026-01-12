'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSize, InterfaceSize } from '../contexts/SizeContext';
import InstallPWA from '../components/InstallPWA';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Prevent SSR render - return early before hooks
    if (!mounted) {
        return <div className="min-h-screen bg-[#0a0a0f]" />;
    }

    return <SettingsContent />;
}

function SettingsContent() {
    const router = useRouter();
    const { size, setSize } = useSize();

    const sizes: { value: InterfaceSize; label: string; description: string }[] = [
        { value: 'small', label: 'Small', description: 'Compact interface with smaller text' },
        { value: 'normal', label: 'Normal', description: 'Default interface size' },
        { value: 'large', label: 'Large', description: 'Larger text and elements for better readability' },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-white/10">
                <div className="flex items-center gap-3 p-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/10 rounded-lg transition-all"
                        aria-label="Go back"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold">Settings</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Interface Size Section */}
                <section className="bg-white/5 rounded-2xl p-6 space-y-4">
                    <div>
                        <h2 className="text-lg font-semibold mb-1">Interface Size</h2>
                        <p className="text-sm text-white/60">
                            Adjust the size of text and UI elements throughout the app
                        </p>
                    </div>

                    <div className="space-y-3">
                        {sizes.map((sizeOption) => (
                            <button
                                key={sizeOption.value}
                                onClick={() => setSize(sizeOption.value)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${size === sizeOption.value
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-white/10 hover:border-white/20 bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{sizeOption.label}</div>
                                        <div className="text-sm text-white/60 mt-1">
                                            {sizeOption.description}
                                        </div>
                                    </div>
                                    <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${size === sizeOption.value
                                            ? 'border-blue-500'
                                            : 'border-white/30'
                                            }`}
                                    >
                                        {size === sizeOption.value && (
                                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Preview Text */}
                    <div className="mt-4 p-4 bg-white/5 rounded-xl">
                        <p className="text-white/60 text-sm mb-2">Preview:</p>
                        <p className="text-base">
                            The quick brown fox jumps over the lazy dog
                        </p>
                        <p className="text-sm text-white/60 mt-1">
                            This is how text will appear in your selected size
                        </p>
                    </div>
                </section>

                {/* PWA Install Section */}
                <section className="bg-white/5 rounded-2xl p-6 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                            <Smartphone className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold mb-1">Install App</h2>
                            <p className="text-sm text-white/60">
                                Install JoinMe on your device for quick access and a native app experience
                            </p>
                        </div>
                    </div>

                    <InstallPWA variant="button" />
                </section>

                {/* App Info */}
                <section className="bg-white/5 rounded-2xl p-6 space-y-2">
                    <h2 className="text-lg font-semibold mb-3">About</h2>
                    <div className="text-sm text-white/60 space-y-1">
                        <p>JoinMe - Connect with people nearby</p>
                        <p>Version 1.0.0</p>
                    </div>
                </section>
            </div>
        </div>
    );
}
