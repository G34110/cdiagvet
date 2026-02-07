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

  // Create products (diagnostic tests)
  const productsData = [
    { code: 'DIAG-BVD', name: 'Test BVD (Bovine Viral Diarrhea)', unitPrice: 45.00, filiereCode: 'BOVINE' },
    { code: 'DIAG-IBR', name: 'Test IBR (Rhinotrachéite Infectieuse Bovine)', unitPrice: 42.00, filiereCode: 'BOVINE' },
    { code: 'DIAG-PARA', name: 'Analyse Parasitologie', unitPrice: 35.00, filiereCode: 'BOVINE' },
    { code: 'DIAG-LEPTO', name: 'Test Leptospirose', unitPrice: 55.00, filiereCode: 'BOVINE' },
    { code: 'DIAG-PORC-PRRS', name: 'Test SDRP (PRRS)', unitPrice: 48.00, filiereCode: 'PORCINE' },
    { code: 'DIAG-PORC-PPA', name: 'Test Peste Porcine Africaine', unitPrice: 65.00, filiereCode: 'PORCINE' },
    { code: 'DIAG-PORC-CIRC', name: 'Test Circovirus Porcin', unitPrice: 52.00, filiereCode: 'PORCINE' },
    { code: 'DIAG-OVI-VISCO', name: 'Test Visna-Maedi', unitPrice: 38.00, filiereCode: 'OVINE' },
    { code: 'DIAG-OVI-TREMB', name: 'Test Tremblante', unitPrice: 75.00, filiereCode: 'OVINE' },
    { code: 'DIAG-CAN-LEISH', name: 'Test Leishmaniose', unitPrice: 42.00, filiereCode: 'CANINE' },
    { code: 'DIAG-CAN-PARVO', name: 'Test Parvovirose', unitPrice: 35.00, filiereCode: 'CANINE' },
    { code: 'DIAG-AVI-NEWC', name: 'Test Newcastle', unitPrice: 28.00, filiereCode: 'AVICULTURE' },
    { code: 'DIAG-AVI-SALM', name: 'Test Salmonellose Aviaire', unitPrice: 32.00, filiereCode: 'AVICULTURE' },
    { code: 'DIAG-API-VARR', name: 'Analyse Varroa', unitPrice: 25.00, filiereCode: 'APICULTURE' },
    { code: 'DIAG-API-LOQUE', name: 'Test Loque Américaine', unitPrice: 45.00, filiereCode: 'APICULTURE' },
    { code: 'KIT-PRELEVEMENT', name: 'Kit de prélèvement standard', unitPrice: 12.00, filiereCode: null },
    { code: 'KIT-TRANSPORT', name: 'Kit de transport réfrigéré', unitPrice: 18.00, filiereCode: null },
  ];

  const products: Record<string, any> = {};
  for (const p of productsData) {
    const filiereId = p.filiereCode ? filieres[p.filiereCode]?.id : null;
    products[p.code] = await prisma.product.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: p.code } },
      update: { unitPrice: p.unitPrice },
      create: {
        code: p.code,
        name: p.name,
        unitPrice: p.unitPrice,
        filiereId,
        tenantId: tenant.id,
        isActive: true,
      },
    });
  }

  // Create product kits
  const kitsData = [
    {
      code: 'KIT-BOVINE-COMPLET',
      name: 'Kit Diagnostic Bovin Complet',
      description: 'Ensemble complet pour le diagnostic sanitaire bovin',
      price: 150.00,
      items: [
        { productCode: 'DIAG-BVD', quantity: 1 },
        { productCode: 'DIAG-IBR', quantity: 1 },
        { productCode: 'DIAG-PARA', quantity: 1 },
        { productCode: 'KIT-PRELEVEMENT', quantity: 2 },
      ],
    },
    {
      code: 'KIT-PORCINE-SANITAIRE',
      name: 'Kit Sanitaire Porcin',
      description: 'Tests essentiels pour élevage porcin',
      price: 145.00,
      items: [
        { productCode: 'DIAG-PORC-PRRS', quantity: 1 },
        { productCode: 'DIAG-PORC-PPA', quantity: 1 },
        { productCode: 'DIAG-PORC-CIRC', quantity: 1 },
        { productCode: 'KIT-PRELEVEMENT', quantity: 3 },
      ],
    },
    {
      code: 'KIT-OVINE-BASE',
      name: 'Kit Diagnostic Ovin de Base',
      description: 'Tests de base pour élevage ovin',
      price: 100.00,
      items: [
        { productCode: 'DIAG-OVI-VISCO', quantity: 1 },
        { productCode: 'DIAG-OVI-TREMB', quantity: 1 },
        { productCode: 'KIT-PRELEVEMENT', quantity: 2 },
      ],
    },
  ];

  for (const k of kitsData) {
    const existingKit = await prisma.productKit.findFirst({
      where: { tenantId: tenant.id, code: k.code },
    });

    if (!existingKit) {
      await prisma.productKit.create({
        data: {
          code: k.code,
          name: k.name,
          description: k.description,
          price: k.price,
          tenantId: tenant.id,
          isActive: true,
          items: {
            create: k.items.map((item) => ({
              productId: products[item.productCode].id,
              quantity: item.quantity,
            })),
          },
        },
      });
    }
  }

  // ============================================
  // OPPORTUNITIES WITH PRODUCT LINES
  // ============================================

  // Delete existing opportunities
  await prisma.opportunityLine.deleteMany({});
  await prisma.opportunity.deleteMany({});

  // Get all clients to create opportunities
  const allClients = await prisma.client.findMany({
    where: { tenantId: tenant.id },
    take: 5,
  });

  // Get products and kits for opportunity lines
  const allProducts = await prisma.product.findMany({
    where: { tenantId: tenant.id, isActive: true },
    take: 10,
  });

  const allKits = await prisma.productKit.findMany({
    where: { tenantId: tenant.id, isActive: true },
  });

  const opportunityStatuses = ['NOUVEAU', 'QUALIFICATION', 'PROPOSITION', 'NEGOCIATION', 'GAGNE'];
  const opportunitySources = ['SALON', 'APPEL_ENTRANT', 'RECOMMANDATION', 'SITE_WEB'];

  let opportunityCount = 0;
  for (let i = 0; i < Math.min(allClients.length, 5); i++) {
    const client = allClients[i];
    const status = opportunityStatuses[i % opportunityStatuses.length];
    const source = opportunitySources[i % opportunitySources.length];

    // Create opportunity with lines
    const lines: { productName: string; quantity: number; unitPrice: number; productId?: string; kitId?: string }[] = [];

    // Add 1-3 random products
    const numProducts = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numProducts && j < allProducts.length; j++) {
      const product = allProducts[(i + j) % allProducts.length];
      lines.push({
        productName: product.name,
        quantity: Math.floor(Math.random() * 5) + 1,
        unitPrice: product.unitPrice,
        productId: product.id,
      });
    }

    // Maybe add a kit (50% chance)
    if (allKits.length > 0 && Math.random() > 0.5) {
      const kit = allKits[i % allKits.length];
      lines.push({
        productName: `Kit: ${kit.name}`,
        quantity: 1,
        unitPrice: kit.price,
        kitId: kit.id,
      });
    }

    // Calculate total amount from lines
    const totalAmount = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);

    const probability = status === 'NOUVEAU' ? 10 : status === 'QUALIFICATION' ? 25 : status === 'PROPOSITION' ? 50 : status === 'NEGOCIATION' ? 75 : 100;

    const opportunity = await prisma.opportunity.create({
      data: {
        title: `Opportunité ${client.name}`,
        contactName: client.name,
        contactEmail: client.email || undefined,
        source: source as any,
        amount: totalAmount,
        probability,
        expectedCloseDate: new Date(Date.now() + (30 + i * 15) * 24 * 60 * 60 * 1000),
        status: status as any,
        notes: `Opportunité créée automatiquement pour ${client.name}`,
        clientId: client.id,
        ownerId: commercial.id,
        tenantId: tenant.id,
        lines: {
          create: lines,
        },
      },
    });

    opportunityCount++;
  }

  console.log('✅ Seed data created:');
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - Admin: ${admin.email}`);
  console.log(`   - Commercial: ${commercial.email}`);
  console.log(`   - Products: ${productsData.length}`);
  console.log(`   - Product Kits: ${kitsData.length}`);
  console.log(`   - Opportunities: ${opportunityCount}`);
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
