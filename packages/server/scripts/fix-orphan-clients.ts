import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find clients without valid commercialId
  const orphanClients = await prisma.client.findMany({
    where: {
      OR: [
        { commercialId: null },
        { commercialId: '' },
        { commercialId: 'undefined' },
      ]
    },
    select: { id: true, name: true, commercialId: true }
  });

  console.log('Clients orphelins trouvés:', orphanClients.length);
  console.log(orphanClients);

  if (orphanClients.length > 0) {
    // Get the first commercial user
    const commercial = await prisma.user.findFirst({
      where: { role: 'COMMERCIAL' },
      select: { id: true, email: true }
    });

    if (commercial) {
      console.log(`\nAssignation au commercial: ${commercial.email}`);
      
      const updated = await prisma.client.updateMany({
        where: {
          id: { in: orphanClients.map(c => c.id) }
        },
        data: { commercialId: commercial.id }
      });

      console.log(`${updated.count} clients mis à jour`);
    } else {
      console.log('Aucun commercial trouvé');
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
