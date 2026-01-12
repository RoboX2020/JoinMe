import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

// Initialize outside handler but check for keys
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    try {
        webpush.setVapidDetails(
            'mailto:support@joinme.com',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        )
    } catch (err) {
        console.error('VAPID Setup Error:', err)
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            // Ideally secure this with an admin check or shared secret for internal triggers
            // For now, allow authenticated users to trigger notifications (e.g. sending a message)
            // or check if the sender is authorized.
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { userId, title, body, url } = await req.json()

        const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId }
        })

        if (subscriptions.length === 0) {
            return NextResponse.json({ message: 'No subscriptions found' })
        }

        // Send to all user devices
        const notifications = subscriptions.map(sub => {
            const payload = JSON.stringify({
                title,
                body,
                url: url || '/'
            })

            return webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }, payload).catch(err => {
                // If 410 Gone, subscription is invalid
                if (err.statusCode === 410) {
                    prisma.pushSubscription.delete({
                        where: { endpoint: sub.endpoint }
                    }).catch(console.error)
                }
                console.error('Push error:', err)
            })
        })

        await Promise.all(notifications)

        return NextResponse.json({ success: true, count: notifications.length })
    } catch (error) {
        console.error('Notification send error:', error)
        return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
    }
}
