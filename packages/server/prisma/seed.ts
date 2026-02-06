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

  // Create commercial users
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

  const commercial2 = await prisma.user.upsert({
    where: { email: 'commercial2@cdiagvet.local' },
    update: {},
    create: {
      email: 'commercial2@cdiagvet.local',
      passwordHash: hashedPassword,
      firstName: 'Marc',
      lastName: 'Leroy',
      role: 'COMMERCIAL',
      tenantId: tenant.id,
    },
  });

  const commercial3 = await prisma.user.upsert({
    where: { email: 'commercial3@cdiagvet.local' },
    update: {},
    create: {
      email: 'commercial3@cdiagvet.local',
      passwordHash: hashedPassword,
      firstName: 'Anne',
      lastName: 'Girard',
      role: 'COMMERCIAL',
      tenantId: tenant.id,
    },
  });

  // Create filières
  const filieresData = [
    { code: 'PORCINE', name: 'Porcine' },
    { code: 'CANINE', name: 'Canine' },
    { code: 'OVINE', name: 'Ovine' },
    { code: 'BOVINE', name: 'Bovine' },
    { code: 'APICULTURE', name: 'Apiculture' },
    { code: 'AVICULTURE', name: 'Aviculture' },
  ];

  const filieres: Record<string, any> = {};
  for (const f of filieresData) {
    filieres[f.code] = await prisma.filiere.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: f.code } },
      update: {},
      create: {
        code: f.code,
        name: f.name,
        tenantId: tenant.id,
      },
    });
  }

  // Delete old responsable user if exists
  await prisma.user.deleteMany({
    where: { email: 'responsable@cdiagvet.local' },
  });

  // Create Responsable Filière users (with one or multiple filières)
  const responsablesData = [
    { codes: ['BOVINE'], email: 'responsable-bov@cdiagvet.local', firstName: 'Marie', lastName: 'Martin' },
    { codes: ['PORCINE'], email: 'responsable-porc@cdiagvet.local', firstName: 'Pierre', lastName: 'Duval' },
    { codes: ['OVINE'], email: 'responsable-ov@cdiagvet.local', firstName: 'Sophie', lastName: 'Bernard' },
    { codes: ['CANINE'], email: 'responsable-can@cdiagvet.local', firstName: 'Lucas', lastName: 'Petit' },
    { codes: ['AVICULTURE', 'APICULTURE'], email: 'responsable-avi@cdiagvet.local', firstName: 'Claire', lastName: 'Moreau' }, // Multi-filière
  ];

  const responsables: any[] = [];
  for (const r of responsablesData) {
    const resp = await prisma.user.upsert({
      where: { email: r.email },
      update: {},
      create: {
        email: r.email,
        passwordHash: hashedPassword,
        firstName: r.firstName,
        lastName: r.lastName,
        role: 'RESPONSABLE_FILIERE',
        tenantId: tenant.id,
      },
    });

    // Associate user with filières via UserFiliere join table
    for (const code of r.codes) {
      await prisma.userFiliere.upsert({
        where: { userId_filiereId: { userId: resp.id, filiereId: filieres[code].id } },
        update: {},
        create: {
          userId: resp.id,
          filiereId: filieres[code].id,
        },
      });
    }

    responsables.push(resp);
  }

  // Create test clients for Responsable Filière (BOVINE)
  const clientsBovine = [
    { name: 'Élevage Durand', city: 'Limoges', postalCode: '87000', email: 'durand@elevage.fr' },
    { name: 'Ferme des Prairies', city: 'Tulle', postalCode: '19000', email: 'prairies@ferme.fr' },
    { name: 'GAEC du Plateau', city: 'Brive', postalCode: '19100', email: 'plateau@gaec.fr' },
  ];

  for (const c of clientsBovine) {
    // Check if client exists
    let client = await prisma.client.findFirst({
      where: { tenantId: tenant.id, email: c.email },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: c.name,
          addressLine1: '123 Route de la Ferme',
          city: c.city,
          postalCode: c.postalCode,
          country: 'FR',
          email: c.email,
          phone: '05 55 00 00 00',
          tenantId: tenant.id,
          commercialId: commercial.id,
          isActive: true,
        },
      });
    }

    // Associate client with BOVINE filière
    await prisma.clientFiliere.upsert({
      where: { clientId_filiereId: { clientId: client.id, filiereId: filieres['BOVINE'].id } },
      update: {},
      create: {
        clientId: client.id,
        filiereId: filieres['BOVINE'].id,
      },
    });

    // Create visits for this month
    const now = new Date();
    const visitDate = new Date(now.getFullYear(), now.getMonth(), Math.floor(Math.random() * 15) + 1);
    
    await prisma.visit.create({
      data: {
        date: visitDate,
        subject: 'Visite de routine',
        notes: 'Contrôle sanitaire effectué',
        clientId: client.id,
        userId: commercial.id,
      },
    });
  }

  // Create test clients for OVINE filière
  const clientsOvine = [
    { name: 'Bergerie du Larzac', city: 'Millau', postalCode: '12100', email: 'larzac@bergerie.fr' },
    { name: 'Élevage Mouton d\'Or', city: 'Rodez', postalCode: '12000', email: 'moutondor@elevage.fr' },
  ];

  for (const c of clientsOvine) {
    let client = await prisma.client.findFirst({
      where: { tenantId: tenant.id, email: c.email },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: c.name,
          addressLine1: '456 Chemin des Pâturages',
          city: c.city,
          postalCode: c.postalCode,
          country: 'FR',
          email: c.email,
          phone: '05 65 00 00 00',
          tenantId: tenant.id,
          commercialId: commercial.id,
          isActive: true,
        },
      });
    }

    await prisma.clientFiliere.upsert({
      where: { clientId_filiereId: { clientId: client.id, filiereId: filieres['OVINE'].id } },
      update: {},
      create: {
        clientId: client.id,
        filiereId: filieres['OVINE'].id,
      },
    });
  }

  console.log('✅ Seed data created:');
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - Admin: ${admin.email}`);
  console.log(`   - Commercial: ${commercial.email}`);
  console.log(`   - Responsables Filière: ${responsables.length}`);
  responsablesData.forEach(r => console.log(`      • ${r.email} (${r.codes.join(', ')})`));
  console.log(`   - Filières: ${filieresData.length}`);
  console.log(`   - Clients Bovine: ${clientsBovine.length}`);
  console.log('\n📧 Credentials: [email] / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
