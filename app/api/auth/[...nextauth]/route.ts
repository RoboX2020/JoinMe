import NextAuth, { AuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { Adapter } from "next-auth/adapters"

export const dynamic = 'force-dynamic';

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma) as Adapter,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    emailVerified: profile.email_verified ? new Date() : null,
                }
            },
        }),
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "email", type: "text" },
                password: { label: "password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user || !user?.password) {
                    return null;
                }

                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isCorrectPassword) {
                    return null;
                }

                return user;
            }
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                // For OAuth providers
                if (account?.provider === 'google') {
                    // Make sure user exists
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email! }
                    });

                    if (existingUser) {
                        // Update existing user info from Google
                        await prisma.user.update({
                            where: { email: user.email! },
                            data: {
                                name: user.name || existingUser.name,
                                image: user.image || existingUser.image,
                                emailVerified: new Date(),
                            }
                        }).catch(err => {
                            console.error('Error updating user:', err);
                        });
                    }
                }
                return true;
            } catch (error) {
                console.error('SignIn callback error:', error);
                return true; // Allow signin anyway
            }
        },
        async jwt({ token, user, account, trigger }) {
            // Initial sign in
            if (user) {
                token.id = user.id;
                token.email = user.email;
            }

            // Always fetch latest user data
            if (token.email) {
                try {
                    const dbUser = await prisma.user.findUnique({
                        where: { email: token.email as string },
                        select: { id: true }
                    });

                    if (dbUser) {
                        token.id = dbUser.id;
                    }
                } catch (error) {
                    console.error('JWT callback error:', error);
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                try {
                    // Fetch fresh user data from database
                    const dbUser = await prisma.user.findUnique({
                        where: { email: token.email as string },
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            bio: true,
                            profession: true,
                        }
                    });

                    if (dbUser) {
                        // @ts-ignore
                        session.user.id = dbUser.id;
                        session.user.name = dbUser.name;
                        session.user.email = dbUser.email;
                        session.user.image = dbUser.image;
                    }
                } catch (error) {
                    console.error('Session callback error:', error);
                    // Fallback to token data
                    // @ts-ignore
                    session.user.id = token.id;
                }
            }
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/login',
    },
    debug: false, // Set to true to see detailed logs on Vercel
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
