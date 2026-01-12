'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, MessageCircle, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function BottomNav() {
    const pathname = usePathname()

    // We can add the compose button here for the "Dock" feel
    const navItems = [
        { name: 'Home', icon: Home, href: '/' },
        { name: 'Find Friends', icon: Users, href: '/explore' },
        { name: 'Messages', icon: MessageCircle, href: '/messages' },
        { name: 'Profile', icon: User, href: '/profile' },
    ]

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between bg-card backdrop-blur-xl p-2 rounded-[2rem] shadow-float border border-border w-full pointer-events-auto"
        >
            {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                    <Link
                        key={item.name}
                        href={item.href}
                        className="relative p-3 flex-1 flex flex-col items-center justify-center gap-1 group"
                    >
                        {isActive && (
                            <motion.div
                                layoutId="nav-pill"
                                className="absolute inset-0 bg-white/10 dark:bg-black/20 rounded-[1.5rem]"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <item.icon
                            size={24}
                            className={`z-10 transition-colors duration-300 ${isActive ? 'text-blue-500' : 'text-zinc-500 dark:text-zinc-400'
                                }`}
                        />
                    </Link>
                )
            })}
        </motion.div>
    )
}
