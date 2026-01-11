import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/users/nearby - Find nearby users
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const lat = parseFloat(searchParams.get('lat') || '0')
        const lng = parseFloat(searchParams.get('lng') || '0')
        const radiusKm = parseFloat(searchParams.get('radius') || '5')

        if (!lat || !lng) {
            return NextResponse.json({ error: 'Location required' }, { status: 400 })
        }

        const currentUser = await prisma.user.findUnique({
            where: { email: session.user.email },
        })

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Get all users with location data
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: currentUser.id } },
                    { currentLat: { not: null } },
                    { currentLng: { not: null } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
                currentLat: true,
                currentLng: true,
            }
        })

        // Calculate distance and filter by radius
        const usersWithDistance = users
            .map(user => {
                const distance = calculateDistance(
                    lat, lng,
                    user.currentLat!, user.currentLng!
                )
                return { ...user, distance }
            })
            .filter(user => user.distance <= radiusKm)
            .sort((a, b) => a.distance - b.distance)

        // Check friendship status
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

        const usersWithStatus = usersWithDistance.map(user => ({
            ...user,
            friendshipStatus: friendshipMap.get(user.id) || null
        }))

        return NextResponse.json(usersWithStatus)
    } catch (error) {
        console.error('Error fetching nearby users:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Radius of the Earth in km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function toRad(degrees: number): number {
    return degrees * (Math.PI / 180)
}
