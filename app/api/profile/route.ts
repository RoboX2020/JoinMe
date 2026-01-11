import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // @ts-ignore
        const userId = session.user.id

        const body = await req.json()
        const {
            name,
            bio,
            image,
            profession,
            location,
            radiusKm,
            accountLinks,
            interests
        } = body

        // Validate radius if provided
        if (radiusKm !== undefined && (radiusKm < 0.5 || radiusKm > 50)) {
            return NextResponse.json(
                { error: 'Radius must be between 0.5 and 50 km' },
                { status: 400 }
            )
        }

        // Build update object (only include fields that were provided)
        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (bio !== undefined) updateData.bio = bio
        if (image !== undefined) updateData.image = image
        if (profession !== undefined) updateData.profession = profession
        if (location !== undefined) updateData.location = location
        if (radiusKm !== undefined) updateData.radiusKm = parseFloat(radiusKm)
        if (accountLinks !== undefined) updateData.accountLinks = accountLinks
        if (interests !== undefined) updateData.interests = interests

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                bio: true,
                profession: true,
                location: true,
                radiusKm: true,
                accountLinks: true,
                interests: true
            }
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Error updating profile:', error)
        return NextResponse.json(
            { error: 'Failed to update profile' },
            { status: 500 }
        )
    }
}
