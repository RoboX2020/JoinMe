import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const lastChecked = searchParams.get('lastChecked');

    const since = lastChecked ? new Date(lastChecked) : new Date(Date.now() - 60 * 60 * 1000); // Default last hour if fresh load, but client should manage.

    const latRange = 0.02;
    const lngRange = 0.02;

    const posts = await prisma.post.findMany({
        where: {
            active: true,
            createdAt: {
                gt: since
            },
            latitude: {
                gte: lat - latRange,
                lte: lat + latRange,
            },
            longitude: {
                gte: lng - lngRange,
                lte: lng + lngRange
            }
        },
        select: {
            id: true,
            content: true,
            latitude: true,
            longitude: true,
            createdAt: true
        }
    });

    // Filter 1km
    const notifications = posts.filter((post: { latitude: number; longitude: number }) => {
        const d = getDistanceFromLatLonInKm(lat, lng, post.latitude, post.longitude);
        return d <= 1;
    });

    return NextResponse.json({ posts: notifications });
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
