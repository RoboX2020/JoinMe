import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // @ts-ignore
    const myId = session.user.id;
    const { userId: otherId } = await params;

    // Parse query parameters for pagination and incremental updates
    const { searchParams } = new URL(request.url);
    const take = parseInt(searchParams.get('take') || '50'); // Default 50 messages
    const skip = parseInt(searchParams.get('skip') || '0'); // For pagination
    const since = searchParams.get('since'); // ISO timestamp for incremental updates

    try {
        // Build where clause
        const whereClause: any = {
            OR: [
                { senderId: myId, receiverId: otherId },
                { senderId: otherId, receiverId: myId }
            ]
        };

        // If 'since' is provided, only fetch messages newer than that timestamp
        if (since) {
            whereClause.createdAt = {
                gt: new Date(since)
            };
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: Math.min(take, 100), // Max 100 messages per request
            skip: skip,
            select: {
                id: true,
                content: true,
                type: true,
                senderId: true,
                receiverId: true,
                createdAt: true,
                imageUrl: true,
                latitude: true,
                longitude: true,
                read: true,
                sender: {
                    select: {
                        name: true,
                        image: true
                    }
                }
            }
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
