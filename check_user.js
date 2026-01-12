
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const email = 'prajval.2029@gmail.com'; // From screenshot
    console.log(`Checking for user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true, sessions: true }
    });

    if (user) {
        console.log('✅ User FOUND:');
        console.log(`- ID: ${user.id}`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Accounts Linked: ${user.accounts.length}`);
        if (user.accounts.length > 0) {
            console.log(`  - Provider: ${user.accounts[0].provider}`);
        }
    } else {
        console.log('❌ User NOT found in database.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
