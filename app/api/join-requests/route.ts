import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

// GET /api/join-requests - Get join requests for current user's posts
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

        // Parse pagination parameters
        const { searchParams } = new URL(req.url);
        const take = parseInt(searchParams.get('take') || '50');
        const skip = parseInt(searchParams.get('skip') || '0');

        // Get all join requests for user's posts
        const joinRequests = await prisma.joinRequest.findMany({
            where: {
                post: {
                    authorId: currentUser.id
                }
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    }
                },
                post: {
                    select: {
                        id: true,
                        title: true,
                        content: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: Math.min(take, 100), // Max 100 per request
            skip: skip
        })

        return NextResponse.json(joinRequests)
    } catch (error) {
        console.error('Error fetching join requests:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST /api/join-requests - Create a join request
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { postId } = await request.json();

        // Get the post and its author
        const post = await prisma.post.findUnique({
            where: { id: postId },
            include: { author: true }
        });

        if (!post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        // Check if request already exists
        const existing = await prisma.joinRequest.findUnique({
            where: {
                postId_senderId: {
                    postId,
                    // @ts-ignore
                    senderId: session.user.id
                }
            }
        });

        if (existing) {
            return NextResponse.json(existing);
        }

        const joinRequest = await prisma.joinRequest.create({
            data: {
                postId,
                // @ts-ignore
                senderId: session.user.id
            },
            include: {
                sender: true
            }
        });

        // Send a message to the host
        const messageContent = `${joinRequest.sender.name || 'Someone'} wants to join your event: "${post.title || post.content.substring(0, 50)}". Check your notifications to accept or reject.`;

        await prisma.message.create({
            data: {
                content: messageContent,
                // @ts-ignore
                senderId: session.user.id,
                receiverId: post.authorId
            }
        });

        return NextResponse.json(joinRequest);
    } catch (error) {
        console.error('Error creating join request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// PUT /api/join-requests - Update a join request
export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { requestId, status } = await request.json(); // status: ACCEPTED or REJECTED

        const joinRequest = await prisma.joinRequest.update({
            where: { id: requestId },
            data: { status },
            include: {
                post: { include: { author: true } },
                sender: true
            }
        });

        if (status === 'ACCEPTED') {
            // Send a message with location
            const locationLink = `https://www.google.com/maps/dir/?api=1&destination=${joinRequest.post.latitude},${joinRequest.post.longitude}`;
            const messageContent = `I've accepted your request! Here is my location: ${locationLink}`;

            await prisma.message.create({
                data: {
                    content: messageContent,
                    senderId: joinRequest.post.authorId,
                    receiverId: joinRequest.senderId
                }
            });
        }

        return NextResponse.json(joinRequest);
    } catch (error) {
        console.error('Error updating join request:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
