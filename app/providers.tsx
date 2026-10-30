'use client'
// ====================================================================
// providers.tsx - wires up the shared context providers the app
//  needs (theme, auth session, sizes).
// ====================================================================
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    )
}
