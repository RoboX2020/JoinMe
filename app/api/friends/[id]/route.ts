import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PUT /api/friends/[id]/accept - Accept a friend request
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const { id: friendshipId } = await params

        // Update friendship status to ACCEPTED
        const friendship = await prisma.friendship.update({
            where: {
                id: friendshipId,
                friendId: currentUser.id, // Can only accept requests sent to you
                status: 'PENDING'
            },
            data: {
                status: 'ACCEPTED'
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

        return NextResponse.json(friendship)
    } catch (error) {
        console.error('Error accepting friend request:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// DELETE - Reject a friend request
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

        const { id: friendshipId } = await params

        // Delete the friendship request
        await prisma.friendship.delete({
            where: {
                id: friendshipId,
                friendId: currentUser.id, // Can only reject requests sent to you
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error rejecting friend request:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
