import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// =============================================================================
// CONFIGURATION PAR ENVIRONNEMENT
// =============================================================================
const ENV = process.env.NODE_ENV || 'development';
const APP_ENV = process.env.APP_ENV || 'dev';

console.log(`\n🌍 Environnement détecté: NODE_ENV=${ENV}, APP_ENV=${APP_ENV}\n`);

// =============================================================================
// DONNÉES DE BASE (communes à tous les environnements)
// =============================================================================
async function seedBase(hashedPassword: string) {
  // Create tenant
  const tenantName = APP_ENV === 'production' 
    ? 'CDiagVet Production' 
    : APP_ENV === 'demo' 
      ? 'CDiagVet Démonstration'
      : 'CDiagVet Développement';

  const tenant = await prisma.tenant.upsert({
    where: { id: 'tenant-main' },
    update: { name: tenantName },
    create: {
      id: 'tenant-main',
      name: tenantName,
      slug: APP_ENV === 'production' ? 'prod' : APP_ENV === 'demo' ? 'demo' : 'dev',
    },
  });

  // Create admin user (TOUJOURS créé)
  const adminEmail = APP_ENV === 'production' 
    ? 'admin@cdiagvet.fr'
    : APP_ENV === 'demo'
      ? 'admin@demo.cdiagvet.fr'
      : 'admin@cdiagvet.local';

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      firstName: 'Administrateur',
      lastName: 'CDiagVet',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  // Create filières (structure commune)
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

  // Create products (catalogue commun)
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

  console.log('✅ Données de base créées:');
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - Admin: ${admin.email}`);
  console.log(`   - Filières: ${filieresData.length}`);
  console.log(`   - Produits: ${productsData.length}`);
  console.log(`   - Kits: ${kitsData.length}`);

  return { tenant, admin, filieres, products, hashedPassword };
}

// =============================================================================
// SEED PRODUCTION (minimal)
// =============================================================================
async function seedProduction(base: any) {
  console.log('\n🏭 Mode PRODUCTION - Aucune donnée de test créée');
  console.log('   Seuls l\'admin et le catalogue produits sont disponibles.');
  console.log(`\n📧 Connexion: ${base.admin.email} / [mot de passe défini]`);
}

// =============================================================================
// SEED DEMO (données réalistes pour présentation)
// =============================================================================
async function seedDemo(base: any) {
  const { tenant, filieres, products, hashedPassword } = base;

  console.log('\n🎭 Mode DEMO - Création de données de démonstration...');

  // Commercial de démo
  const commercial = await prisma.user.upsert({
    where: { email: 'commercial@demo.cdiagvet.fr' },
    update: {},
    create: {
      email: 'commercial@demo.cdiagvet.fr',
      passwordHash: hashedPassword,
      firstName: 'Sophie',
      lastName: 'Martin',
      role: 'COMMERCIAL',
      tenantId: tenant.id,
    },
  });

  // Responsable filière de démo
  const responsable = await prisma.user.upsert({
    where: { email: 'responsable@demo.cdiagvet.fr' },
    update: {},
    create: {
      email: 'responsable@demo.cdiagvet.fr',
      passwordHash: hashedPassword,
      firstName: 'Pierre',
      lastName: 'Durand',
      role: 'RESPONSABLE_FILIERE',
      tenantId: tenant.id,
    },
  });

  await prisma.userFiliere.upsert({
    where: { userId_filiereId: { userId: responsable.id, filiereId: filieres['BOVINE'].id } },
    update: {},
    create: { userId: responsable.id, filiereId: filieres['BOVINE'].id },
  });

  // Clients de démo (noms réalistes mais fictifs)
  const clientsDemo = [
    { name: 'GAEC Les Trois Vallées', city: 'Aurillac', postalCode: '15000', email: 'contact@gaec3vallees.fr', filiere: 'BOVINE' },
    { name: 'Élevage Montagne Verte', city: 'Rodez', postalCode: '12000', email: 'info@montagneverte.fr', filiere: 'BOVINE' },
    { name: 'SAS Porc Excellence', city: 'Rennes', postalCode: '35000', email: 'commercial@porcexcellence.fr', filiere: 'PORCINE' },
    { name: 'Bergerie du Larzac', city: 'Millau', postalCode: '12100', email: 'bergerie@larzac.fr', filiere: 'OVINE' },
  ];

  for (const c of clientsDemo) {
    let client = await prisma.client.findFirst({
      where: { tenantId: tenant.id, email: c.email },
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: c.name,
          addressLine1: '123 Route Principale',
          city: c.city,
          postalCode: c.postalCode,
          country: 'FR',
          email: c.email,
          phone: '05 00 00 00 00',
          tenantId: tenant.id,
          commercialId: commercial.id,
          isActive: true,
        },
      });

      await prisma.clientFiliere.create({
        data: {
          clientId: client.id,
          filiereId: filieres[c.filiere].id,
        },
      });
    }
  }

  // Opportunités de démo
  await prisma.opportunityLine.deleteMany({});
  await prisma.opportunity.deleteMany({});

  const demoOpportunities = [
    { title: 'Contrat annuel GAEC Les Trois Vallées', status: 'PROPOSITION', amount: 2500, probability: 60 },
    { title: 'Extension tests Montagne Verte', status: 'NEGOCIATION', amount: 1800, probability: 80 },
    { title: 'Nouveau client Porc Excellence', status: 'QUALIFICATION', amount: 3200, probability: 30 },
    { title: 'Renouvellement Bergerie du Larzac', status: 'GAGNE', amount: 950, probability: 100 },
  ];

  const clients = await prisma.client.findMany({ where: { tenantId: tenant.id }, take: 4 });

  for (let i = 0; i < demoOpportunities.length && i < clients.length; i++) {
    const opp = demoOpportunities[i];
    await prisma.opportunity.create({
      data: {
        title: opp.title,
        contactName: clients[i].name,
        contactEmail: clients[i].email || undefined,
        source: 'RECOMMANDATION',
        amount: opp.amount,
        probability: opp.probability,
        expectedCloseDate: new Date(Date.now() + (30 + i * 15) * 24 * 60 * 60 * 1000),
        status: opp.status as any,
        clientId: clients[i].id,
        ownerId: commercial.id,
        tenantId: tenant.id,
      },
    });
  }

  console.log('✅ Données DEMO créées:');
  console.log(`   - Commercial: commercial@demo.cdiagvet.fr`);
  console.log(`   - Responsable: responsable@demo.cdiagvet.fr`);
  console.log(`   - Clients: ${clientsDemo.length}`);
  console.log(`   - Opportunités: ${demoOpportunities.length}`);
  console.log('\n📧 Mot de passe pour tous: admin123');
}

// =============================================================================
// SEED DÉVELOPPEMENT (données volumineuses pour tests)
// =============================================================================
async function seedDevelopment(base: any) {
  const { tenant, filieres, products, hashedPassword } = base;

  console.log('\n🛠️  Mode DEV - Création de données de test volumineuses...');

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

  // Delete old responsable user if exists
  await prisma.user.deleteMany({
    where: { email: 'responsable@cdiagvet.local' },
  });

  // Create Responsable Filière users
  const responsablesData = [
    { codes: ['BOVINE'], email: 'responsable-bov@cdiagvet.local', firstName: 'Marie', lastName: 'Martin' },
    { codes: ['PORCINE'], email: 'responsable-porc@cdiagvet.local', firstName: 'Pierre', lastName: 'Duval' },
    { codes: ['OVINE'], email: 'responsable-ov@cdiagvet.local', firstName: 'Sophie', lastName: 'Bernard' },
    { codes: ['CANINE'], email: 'responsable-can@cdiagvet.local', firstName: 'Lucas', lastName: 'Petit' },
    { codes: ['AVICULTURE', 'APICULTURE'], email: 'responsable-avi@cdiagvet.local', firstName: 'Claire', lastName: 'Moreau' },
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

    for (const code of r.codes) {
      await prisma.userFiliere.upsert({
        where: { userId_filiereId: { userId: resp.id, filiereId: filieres[code].id } },
        update: {},
        create: { userId: resp.id, filiereId: filieres[code].id },
      });
    }
    responsables.push(resp);
  }

  // Create test clients BOVINE
  const clientsBovine = [
    { name: 'Élevage Durand', city: 'Limoges', postalCode: '87000', email: 'durand@elevage.fr' },
    { name: 'Ferme des Prairies', city: 'Tulle', postalCode: '19000', email: 'prairies@ferme.fr' },
    { name: 'GAEC du Plateau', city: 'Brive', postalCode: '19100', email: 'plateau@gaec.fr' },
  ];

  for (const c of clientsBovine) {
    let client = await prisma.client.findFirst({ where: { tenantId: tenant.id, email: c.email } });
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: c.name, addressLine1: '123 Route de la Ferme', city: c.city,
          postalCode: c.postalCode, country: 'FR', email: c.email, phone: '05 55 00 00 00',
          tenantId: tenant.id, commercialId: commercial.id, isActive: true,
        },
      });
    }
    await prisma.clientFiliere.upsert({
      where: { clientId_filiereId: { clientId: client.id, filiereId: filieres['BOVINE'].id } },
      update: {},
      create: { clientId: client.id, filiereId: filieres['BOVINE'].id },
    });

    const now = new Date();
    const visitDate = new Date(now.getFullYear(), now.getMonth(), Math.floor(Math.random() * 15) + 1);
    await prisma.visit.create({
      data: { date: visitDate, subject: 'Visite de routine', notes: 'Contrôle sanitaire effectué', clientId: client.id, userId: commercial.id },
    });
  }

  // Create test clients OVINE
  const clientsOvine = [
    { name: 'Bergerie du Larzac', city: 'Millau', postalCode: '12100', email: 'larzac@bergerie.fr' },
    { name: 'Élevage Mouton d\'Or', city: 'Rodez', postalCode: '12000', email: 'moutondor@elevage.fr' },
  ];

  for (const c of clientsOvine) {
    let client = await prisma.client.findFirst({ where: { tenantId: tenant.id, email: c.email } });
    if (!client) {
      client = await prisma.client.create({
        data: {
          name: c.name, addressLine1: '456 Chemin des Pâturages', city: c.city,
          postalCode: c.postalCode, country: 'FR', email: c.email, phone: '05 65 00 00 00',
          tenantId: tenant.id, commercialId: commercial.id, isActive: true,
        },
      });
    }
    await prisma.clientFiliere.upsert({
      where: { clientId_filiereId: { clientId: client.id, filiereId: filieres['OVINE'].id } },
      update: {},
      create: { clientId: client.id, filiereId: filieres['OVINE'].id },
    });
  }

  // Create opportunities
  await prisma.opportunityLine.deleteMany({});
  await prisma.opportunity.deleteMany({});

  const allClients = await prisma.client.findMany({ where: { tenantId: tenant.id }, take: 5 });
  const allProducts = await prisma.product.findMany({ where: { tenantId: tenant.id, isActive: true }, take: 10 });
  const allKits = await prisma.productKit.findMany({ where: { tenantId: tenant.id, isActive: true } });

  const statuses = ['NOUVEAU', 'QUALIFICATION', 'PROPOSITION', 'NEGOCIATION', 'GAGNE'];
  const sources = ['SALON', 'APPEL_ENTRANT', 'RECOMMANDATION', 'SITE_WEB'];

  let opportunityCount = 0;
  for (let i = 0; i < Math.min(allClients.length, 5); i++) {
    const client = allClients[i];
    const status = statuses[i % statuses.length];
    const source = sources[i % sources.length];

    const lines: { productName: string; quantity: number; unitPrice: number; productId?: string; kitId?: string }[] = [];
    const numProducts = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numProducts && j < allProducts.length; j++) {
      const product = allProducts[(i + j) % allProducts.length];
      lines.push({ productName: product.name, quantity: Math.floor(Math.random() * 5) + 1, unitPrice: product.unitPrice, productId: product.id });
    }
    if (allKits.length > 0 && Math.random() > 0.5) {
      const kit = allKits[i % allKits.length];
      lines.push({ productName: `Kit: ${kit.name}`, quantity: 1, unitPrice: kit.price, kitId: kit.id });
    }

    const totalAmount = lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice), 0);
    const probability = status === 'NOUVEAU' ? 10 : status === 'QUALIFICATION' ? 25 : status === 'PROPOSITION' ? 50 : status === 'NEGOCIATION' ? 75 : 100;

    await prisma.opportunity.create({
      data: {
        title: `Opportunité ${client.name}`, contactName: client.name, contactEmail: client.email || undefined,
        source: source as any, amount: totalAmount, probability,
        expectedCloseDate: new Date(Date.now() + (30 + i * 15) * 24 * 60 * 60 * 1000),
        status: status as any, notes: `Opportunité créée automatiquement pour ${client.name}`,
        clientId: client.id, ownerId: commercial.id, tenantId: tenant.id,
        lines: { create: lines },
      },
    });
    opportunityCount++;
  }

  console.log('✅ Données DEV créées:');
  console.log(`   - Commerciaux: 3`);
  console.log(`   - Responsables Filière: ${responsables.length}`);
  console.log(`   - Clients: ${clientsBovine.length + clientsOvine.length}`);
  console.log(`   - Opportunités: ${opportunityCount}`);
  console.log('\n📧 Mot de passe pour tous: admin123');
}

// =============================================================================
// MAIN - Point d'entrée
// =============================================================================
async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Données de base (communes à tous les environnements)
  const base = await seedBase(hashedPassword);

  // Données spécifiques selon l'environnement
  if (APP_ENV === 'production' || ENV === 'production') {
    await seedProduction(base);
  } else if (APP_ENV === 'demo' || ENV === 'staging') {
    await seedDemo(base);
  } else {
    await seedDevelopment(base);
  }

  console.log('\n✨ Seed terminé avec succès!\n');
}

main()
  .catch((e: Error) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
