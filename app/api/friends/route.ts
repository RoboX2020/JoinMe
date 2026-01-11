import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/friends - Get all friends and their recent posts
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get all accepted friendships (both directions)
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userId: currentUser.id, status: 'ACCEPTED' },
                    { friendId: currentUser.id, status: 'ACCEPTED' }
                ]
            },
            include: {
                user: true,
                friend: true,
            }
        })

        // Extract friend IDs
        const friendIds = friendships.map(f =>
            f.userId === currentUser.id ? f.friendId : f.userId
        )

        // Get friends' details
        const friends = await prisma.user.findMany({
            where: {
                id: { in: friendIds }
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
            }
        })

        // Get friends' active posts
        const friendsPosts = await prisma.post.findMany({
            where: {
                authorId: { in: friendIds },
                active: true,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    }
                },
                joinRequests: {
                    where: {
                        senderId: currentUser.id
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 50
        })


        // Get pending friend requests where current user is the receiver
        const pendingRequests = await prisma.friendship.findMany({
            where: {
                friendId: currentUser.id,
                status: 'PENDING'
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    }
                }
            }
        })

        return NextResponse.json({
            friends,
            posts: friendsPosts,
            pendingRequests
        })
    } catch (error) {
        console.error('Error fetching friends:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/friends - Add a friend by email or friendId
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { friendEmail, friendId } = await req.json()

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        let targetFriendId: string
        let status: 'ACCEPTED' | 'PENDING'

        // Determine target friend and status based on input
        if (friendId) {
            // From nearby users or all users list - create PENDING request
            targetFriendId = friendId
            status = 'PENDING'
        } else if (friendEmail) {
            // From email search - auto-accept
            const friendUser = await prisma.user.findUnique({
                where: { email: friendEmail },
            })

            if (!friendUser) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 })
            }

            if (currentUser.id === friendUser.id) {
                return NextResponse.json({ error: 'Cannot add yourself as a friend' }, { status: 400 })
            }

            targetFriendId = friendUser.id
            status = 'ACCEPTED'
        } else {
            return NextResponse.json({ error: 'Must provide friendEmail or friendId' }, { status: 400 })
        }

        // Check if friendship already exists
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { userId: currentUser.id, friendId: targetFriendId },
                    { userId: targetFriendId, friendId: currentUser.id }
                ]
            }
        })

        if (existingFriendship) {
            return NextResponse.json({ error: 'Friendship already exists' }, { status: 400 })
        }

        const friendship = await prisma.friendship.create({
            data: {
                userId: currentUser.id,
                friendId: targetFriendId,
                status
            },
            include: {
                friend: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    }
                }
            }
        })

        return NextResponse.json(friendship)
    } catch (error) {
        console.error('Error adding friend:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
