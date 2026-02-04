import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Get all clients with their commercial
  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    select: { 
      id: true, 
      name: true, 
      commercialId: true,
      commercial: { select: { email: true } }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('Derniers clients:');
  clients.forEach(c => {
    console.log(`- ${c.name} | commercialId: ${c.commercialId} | commercial: ${c.commercial?.email || 'N/A'}`);
  });

  // Get all users
  console.log('\nUtilisateurs:');
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  users.forEach(u => {
    console.log(`- ${u.email} | id: ${u.id} | role: ${u.role}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
