const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser(email) {
    try {
        const user = await prisma.user.findUnique({
            where: { email: email },
            include: { accounts: true },
        });
        console.log('User found:', user);
    } catch (error) {
        console.error('Error finding user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Check for the email from the error message or common test email
// Replacing with the email visible in the screenshot: prajvalarora9793@gmail.com
checkUser('prajvalarora9793@gmail.com');
