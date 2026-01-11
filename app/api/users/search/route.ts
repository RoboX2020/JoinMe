import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/users/search - Search users by email or name
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const query = searchParams.get('q') || ''

        if (query.length < 2) {
            return NextResponse.json([])
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Search users by email or name
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUser.id } }, // Exclude current user
                    {
                        OR: [
                            { email: { contains: query } },
                            { name: { contains: query } }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
            },
            take: 10
        })

        // Check which users are already friends
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userId: currentUser.id },
                    { friendId: currentUser.id }
                ]
            }
        })

        const friendIds = new Set(
            friendships.map(f => f.userId === currentUser.id ? f.friendId : f.userId)
        )

        const usersWithFriendStatus = users.map(user => ({
            ...user,
            isFriend: friendIds.has(user.id)
        }))

        return NextResponse.json(usersWithFriendStatus)
    } catch (error) {
        console.error('Error searching users:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
