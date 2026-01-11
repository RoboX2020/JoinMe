import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, name, password } = body;

        // Validation
        if (!email || !name || !password) {
            return new NextResponse(
                JSON.stringify({ error: "Missing required fields" }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (password.length < 6) {
            return new NextResponse(
                JSON.stringify({ error: "Password must be at least 6 characters" }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return new NextResponse(
                JSON.stringify({ error: "Email already registered" }),
                { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                emailVerified: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, name: user.name }
        });
    } catch (error: any) {
        console.error("REGISTRATION_ERROR:", error);

        return new NextResponse(
            JSON.stringify({ error: "Registration failed. Please try again." }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
