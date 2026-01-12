// Forces deployment update - Settings button added
'use client'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import NotificationDropdown from './NotificationDropdown'
import InstallPWA from './InstallPWA'
import { Settings } from 'lucide-react'

export default function Header() {
    const { data: session } = useSession()

    return (
        <header className="fixed top-0 left-0 right-0 h-16 md:h-20 flex items-center justify-between px-3 md:px-6 z-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            {/* Left: Notification (Mobile only) */}
            <div className="flex items-center gap-2 pointer-events-auto shrink-0 md:hidden">
                <NotificationDropdown />
            </div>

            {/* Center: Logo */}
            <Link href="/" className="pointer-events-auto flex items-center gap-2 group absolute left-1/2 -translate-x-1/2">
                <Image
                    src="/logo.png"
                    alt="JoinMe"
                    width={40}
                    height={40}
                    className="rounded-lg group-hover:scale-110 transition-transform"
                />
                <h1 className="text-lg md:text-xl font-black tracking-tight hidden md:block">
                    JoinMe
                </h1>
            </Link>

            {/* Right: Install Button, Profile + Notification (Desktop) */}
            <div className="flex items-center gap-2 md:gap-3 pointer-events-auto shrink-0 ml-auto">
                <div className="hidden md:block">
                    <InstallPWA variant="button" />
                </div>
                <div className="hidden md:block">
                    <NotificationDropdown />
                </div>

                {/* Settings Link (Always Visible) */}
                <Link href="/settings" className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition text-white">
                    <Settings className="w-5 h-5 md:w-6 md:h-6" />
                </Link>

                {session ? (
                    <Link href="/profile">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-border p-0.5">
                            <img src={session.user?.image || '/default-avatar.png'} alt="Me" className="w-full h-full object-cover rounded-full" />
                        </div>
                    </Link>
                ) : (
                    <Link href="/api/auth/signin" className="text-xs md:text-sm font-bold bg-input-bg px-3 md:px-4 py-1.5 md:py-2 rounded-full hover:bg-zinc-300 dark:hover:bg-white/20 transition">
                        Login
                    </Link>
                )}
            </div>
        </header>
    )
}
