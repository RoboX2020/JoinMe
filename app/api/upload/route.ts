import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { compressImage, validateImage } from '@/lib/imageUtils';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate the image
        const validationError = validateImage(file, 5);
        if (validationError) {
            return NextResponse.json({ error: validationError }, { status: 400 });
        }

        // Read file as data URL (for compression function)
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString('base64');
        const mimeType = file.type;
        const dataUrl = `data:${mimeType};base64,${base64}`;

        // Create a temporary File object for compression
        const blob = new Blob([buffer], { type: mimeType });
        const tempFile = new File([blob], file.name, { type: mimeType });

        // Note: Image compression needs to run on client-side due to canvas API
        // This endpoint just validates and returns the uploaded file
        // Compression will happen on the client before upload

        return NextResponse.json({
            success: true,
            imageUrl: dataUrl,
            size: file.size,
            type: file.type
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
