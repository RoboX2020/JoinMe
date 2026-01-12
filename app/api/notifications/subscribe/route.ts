import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const subscription = await req.json()

        // Save subscription only if it doesn't exist
        await prisma.pushSubscription.upsert({
            where: { endpoint: subscription.endpoint },
            update: {
                userId: session.user.id,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            },
            create: {
                userId: session.user.id,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Subscription error:', error)
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
    }
}
