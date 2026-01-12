'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [data, setData] = useState({
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)
    const [error, setError] = useState('')

    // Show error from URL if any (e.g. ?error=CredentialsSignin)
    useEffect(() => {
        const errorParam = searchParams.get('error')
        if (errorParam === 'CredentialsSignin') {
            setError('Invalid email or password')
        }
    }, [searchParams])

    const loginUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const result = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
            } else {
                router.push('/')
            }
        } catch (error) {
            setError('Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = async () => {
        setGoogleLoading(true)
        signIn('google', { callbackUrl: '/' })
            // Force refresh to ensure new env vars are used
            .then(() => window.location.reload());
    }

    return (
        <>
            <div className="text-center mb-8">
                <div className="flex justify-center mb-4">
                    <Image
                        src="/logo.png"
                        alt="JoinMe"
                        width={100}
                        height={100}
                        className="rounded-2xl"
                    />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
                <p className="text-zinc-400 dark:text-zinc-400">Sign in to your account</p>
            </div>

            <div className="space-y-4">
                {/* Google Sign In */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={googleLoading || loading}
                    className="w-full bg-white text-zinc-900 hover:bg-zinc-200 font-bold py-3 rounded-xl transition flex items-center justify-center gap-3"
                >
                    {googleLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                    )}
                    Continue with Google
                </button>

                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-zinc-500 text-sm">or</span>
                    <div className="flex-grow border-t border-white/10"></div>
                </div>

                <form onSubmit={loginUser} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={data.email}
                            onChange={e => setData({ ...data, email: e.target.value })}
                            className="w-full bg-input-bg border border-border rounded-xl px-4 py-3 text-input-text focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-zinc-500"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-foreground mb-2">Password</label>
                        <input
                            type="password"
                            required
                            value={data.password}
                            onChange={e => setData({ ...data, password: e.target.value })}
                            className="w-full bg-input-bg border border-border rounded-xl px-4 py-3 text-input-text focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-zinc-500"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || googleLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>
            </div>

            <div className="mt-8 text-center bg-card rounded-xl py-3 border border-border">
                <p className="text-zinc-400 dark:text-zinc-400 text-sm">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
                        Sign Up
                    </Link>
                </p>
            </div>
        </>
    )
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-xl">
                <Suspense fallback={<div className="text-white text-center">Loading...</div>}>
                    <LoginForm />
                </Suspense>
            </div>
        </div>
    )
}
