import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/users - Get all users on the platform
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

        // Get all users except current user
        const users = await prisma.user.findMany({
            where: {
                id: { not: currentUser.id }
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        // Check friendship status for each user
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { userId: currentUser.id },
                    { friendId: currentUser.id }
                ]
            }
        })

        const friendshipMap = new Map()
        friendships.forEach(f => {
            const otherId = f.userId === currentUser.id ? f.friendId : f.userId
            friendshipMap.set(otherId, f.status)
        })

        const usersWithStatus = users.map(user => ({
            ...user,
            isFriend: friendshipMap.get(user.id) === 'ACCEPTED',
            friendshipStatus: friendshipMap.get(user.id) || null
        }))

        return NextResponse.json(usersWithStatus)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
