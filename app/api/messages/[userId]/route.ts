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

    try {
        const messages = await prisma.message.findMany({
            where: {
                OR: [
                    { senderId: myId, receiverId: otherId },
                    { senderId: otherId, receiverId: myId }
                ]
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { name: true, image: true } }
            }
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
