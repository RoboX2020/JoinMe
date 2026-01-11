import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { receiverId, content, type, imageUrl, latitude, longitude } = body;

        // Validation
        if (!receiverId || typeof receiverId !== 'string') {
            return NextResponse.json({ error: 'Invalid receiverId' }, { status: 400 });
        }

        if (!content || typeof content !== 'string') {
            return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
        }

        const messageType = type || 'text';
        const validTypes = ['text', 'image', 'location'];

        if (!validTypes.includes(messageType)) {
            return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
        }

        // Verify receiver exists
        const receiver = await prisma.user.findUnique({
            where: { id: receiverId }
        });

        if (!receiver) {
            return NextResponse.json({ error: 'Receiver not found' }, { status: 404 });
        }

        const messageData: any = {
            content,
            // @ts-ignore
            senderId: session.user.id,
            receiverId,
            type: messageType
        };

        // Add media-specific fields with validation
        if (messageType === 'image') {
            if (!imageUrl || typeof imageUrl !== 'string') {
                return NextResponse.json({ error: 'Image URL is required for image messages' }, { status: 400 });
            }

            // Basic validation that it's a data URL
            if (!imageUrl.startsWith('data:image/')) {
                return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
            }

            messageData.imageUrl = imageUrl;
        } else if (messageType === 'location') {
            if (typeof latitude !== 'number' || typeof longitude !== 'number') {
                return NextResponse.json({ error: 'Valid latitude and longitude are required for location messages' }, { status: 400 });
            }

            // Validate coordinates range
            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
            }

            messageData.latitude = latitude;
            messageData.longitude = longitude;
        }

        const message = await prisma.message.create({
            data: messageData,
            include: {
                sender: { select: { name: true, image: true } }
            }
        });

        return NextResponse.json(message, { status: 201 });
    } catch (error) {
        console.error('Error creating message:', error);

        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // @ts-ignore
    const myId = session.user.id;

    try {
        // More efficient: fetch only recent messages to build conversation list
        // Limit to 200 most recent messages (enough to find ~50-100 unique conversations)
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: myId },
                    { receiverId: myId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 200, // Limit query size - will capture recent conversations
            select: {
                id: true,
                content: true,
                type: true,
                senderId: true,
                receiverId: true,
                createdAt: true,
                sender: { select: { id: true, name: true, image: true } },
                receiver: { select: { id: true, name: true, image: true } }
            }
        });

        // Extract unique conversation partners
        const conversations = new Map();

        messages.forEach(msg => {
            const otherUser = msg.senderId === myId ? msg.receiver : msg.sender;
            if (!conversations.has(otherUser.id)) {
                // Generate appropriate preview based on message type
                let preview = msg.content;
                if (msg.type === 'image') {
                    preview = '📷 Photo';
                } else if (msg.type === 'location') {
                    preview = '📍 Location';
                }

                conversations.set(otherUser.id, {
                    user: otherUser,
                    lastMessage: preview,
                    timestamp: msg.createdAt,
                    type: msg.type
                });
            }
        });

        // Return max 50 most recent conversations
        const conversationList = Array.from(conversations.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 50);

        return NextResponse.json(conversationList);
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
