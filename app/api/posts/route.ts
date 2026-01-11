import { authOptions } from '../auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, price, category, lat, lng, imageUrl } = await request.json();

    if (!content || !lat || !lng) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const post = await prisma.post.create({
        data: {
            title: title || content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            content,
            category: category || 'General',
            price: price || 'Free',
            imageUrl: imageUrl || null,
            latitude: lat,
            longitude: lng,
            // @ts-ignore
            authorId: session.user.id as string,
        },
    });

    return NextResponse.json(post);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    // Default radius 1km, could be dynamic later
    const radius = 1;

    const latRange = 0.02;
    const lngRange = 0.02;

    const posts = await prisma.post.findMany({
        where: {
            active: true,
            latitude: {
                gte: lat - latRange,
                lte: lat + latRange,
            },
            longitude: {
                gte: lng - lngRange,
                lte: lng + lngRange
            }
        },
        include: {
            author: {
                select: { name: true, image: true, id: true }
            },
            joinRequests: {
                select: { senderId: true, status: true }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    const filtered = posts.filter((post: { latitude: number; longitude: number }) => {
        const d = getDistanceFromLatLonInKm(lat, lng, post.latitude, post.longitude);
        return d <= radius;
    });

    return NextResponse.json(filtered);
}

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    var R = 6371;
    var dLat = deg2rad(lat2 - lat1);
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180)
}
