import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-demo' },
    update: {},
    create: {
      id: 'tenant-demo',
      name: 'Demo Diagnostics Vétérinaires',
      slug: 'demo',
    },
  });

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cdiagvet.local' },
    update: {},
    create: {
      email: 'admin@cdiagvet.local',
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'CDiagVet',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  // Create commercial user
  const commercial = await prisma.user.upsert({
    where: { email: 'commercial@cdiagvet.local' },
    update: {},
    create: {
      email: 'commercial@cdiagvet.local',
      passwordHash: hashedPassword,
      firstName: 'Jean',
      lastName: 'Dupont',
      role: 'COMMERCIAL',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Seed data created:');
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - Admin: ${admin.email}`);
  console.log(`   - Commercial: ${commercial.email}`);
  console.log('\n📧 Credentials: email / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
