const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUser(email) {
    try {
        const user = await prisma.user.update({
            where: { email: email },
            data: { emailVerified: new Date() },
        });
        console.log('User updated:', user);
    } catch (error) {
        console.error('Error updating user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixUser('prajvalarora9793@gmail.com');
