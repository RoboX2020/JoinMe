'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function RegisterPage() {
    const router = useRouter()
    const [data, setData] = useState({
        name: '',
        email: '',
        password: ''
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const registerUser = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Registration failed')
            }

            // Auto log in after register
            const signInResult = await signIn('credentials', {
                email: data.email,
                password: data.password,
                redirect: false,
            })

            if (signInResult?.error) {
                setError("Account created! Redirecting to login...")
                setTimeout(() => router.push('/login'), 2000)
            } else {
                router.push('/')
            }

        } catch (err: any) {
            setError(err.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl p-8 shadow-xl">
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
                    <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-zinc-400">Join the community today</p>
                </div>

                <form onSubmit={registerUser} className="space-y-4">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-white mb-2">Name</label>
                        <input
                            type="text"
                            required
                            value={data.name}
                            onChange={e => setData({ ...data, name: e.target.value })}
                            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-zinc-600"
                            placeholder="Your Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-white mb-2">Email</label>
                        <input
                            type="email"
                            required
                            value={data.email}
                            onChange={e => setData({ ...data, email: e.target.value })}
                            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-zinc-600"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-white mb-2">Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={data.password}
                            onChange={e => setData({ ...data, password: e.target.value })}
                            className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-zinc-600"
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-zinc-500 mt-1">At least 6 characters</p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading && <Loader2 size={18} className="animate-spin" />}
                        {loading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </form>

                <div className="mt-8 text-center bg-zinc-800/50 rounded-xl py-3 border border-white/5">
                    <p className="text-zinc-400 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
