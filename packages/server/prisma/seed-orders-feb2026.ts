import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating test orders for February 2026 (days 1-8) + January cancellations...');

  const tenant = await prisma.tenant.findFirst({
    where: { slug: 'demo' },
  });

  if (!tenant) {
    console.error('❌ Tenant demo not found. Run main seed first.');
    return;
  }

  const commercial = await prisma.user.findFirst({
    where: { email: 'commercial@cdiagvet.local' },
  });

  if (!commercial) {
    console.error('❌ Commercial user not found. Run main seed first.');
    return;
  }

  const clients = await prisma.client.findMany({
    where: { tenantId: tenant.id },
    take: 10,
  });

  if (clients.length === 0) {
    console.error('❌ No clients found. Run main seed first.');
    return;
  }

  const products = await prisma.product.findMany({
    where: { tenantId: tenant.id, isActive: true },
    take: 5,
  });

  if (products.length === 0) {
    console.error('❌ No products found. Run main seed first.');
    return;
  }

  // Orders data for February 2026 (first 8 days) - mix of validated and cancelled
  const februaryOrders = [
    // Day 1
    { day: 1, clientIdx: 0, status: 'VALIDEE', totalHT: 1200.00 },
    { day: 1, clientIdx: 1, status: 'ANNULEE', totalHT: 450.00 },
    // Day 2
    { day: 2, clientIdx: 2, status: 'LIVREE', totalHT: 2800.00 },
    { day: 2, clientIdx: 3, status: 'VALIDEE', totalHT: 950.00 },
    // Day 3
    { day: 3, clientIdx: 4, status: 'EXPEDIEE', totalHT: 1650.00 },
    { day: 3, clientIdx: 5, status: 'ANNULEE', totalHT: 780.00 },
    // Day 4
    { day: 4, clientIdx: 6, status: 'VALIDEE', totalHT: 3200.00 },
    // Day 5
    { day: 5, clientIdx: 7, status: 'LIVREE', totalHT: 1100.00 },
    { day: 5, clientIdx: 8, status: 'ANNULEE', totalHT: 520.00 },
    // Day 6
    { day: 6, clientIdx: 0, status: 'PREPARATION', totalHT: 2400.00 },
    { day: 6, clientIdx: 1, status: 'VALIDEE', totalHT: 890.00 },
    // Day 7
    { day: 7, clientIdx: 2, status: 'EXPEDIEE', totalHT: 1750.00 },
    { day: 7, clientIdx: 3, status: 'ANNULEE', totalHT: 650.00 },
    // Day 8
    { day: 8, clientIdx: 4, status: 'VALIDEE', totalHT: 2100.00 },
    { day: 8, clientIdx: 5, status: 'LIVREE', totalHT: 1450.00 },
  ];

  // Additional cancelled orders for January 2026
  const januaryCancellations = [
    { day: 8, clientIdx: 6, status: 'ANNULEE', totalHT: 1350.00 },
    { day: 22, clientIdx: 7, status: 'ANNULEE', totalHT: 980.00 },
  ];

  let orderCount = 0;

  // Create February 2026 orders
  console.log('\n📅 Creating February 2026 orders (days 1-8)...');
  for (const orderData of februaryOrders) {
    const client = clients[orderData.clientIdx % clients.length];
    const product = products[orderCount % products.length];
    
    const orderDate = new Date(2026, 1, orderData.day, 10, 0, 0); // Month 1 = February
    const validatedAt = orderData.status !== 'BROUILLON' && orderData.status !== 'ANNULEE' 
      ? new Date(orderDate.getTime() + 2 * 60 * 60 * 1000)
      : null;

    const updatedAt = orderData.status === 'ANNULEE'
      ? new Date(orderDate.getTime() + 4 * 60 * 60 * 1000)
      : orderDate;

    const quantity = Math.floor(Math.random() * 5) + 1;
    const unitPrice = orderData.totalHT / quantity;

    const reference = `CMD-FEB26-${orderData.day.toString().padStart(2, '0')}-${orderCount + 1}`;

    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        reference,
        clientId: client.id,
        ownerId: commercial.id,
        status: orderData.status as any,
        totalHT: orderData.totalHT,
        totalTTC: orderData.totalHT * 1.2,
        validatedAt,
        createdAt: orderDate,
        updatedAt,
        lines: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              productCode: product.code,
              quantity,
              unitPrice,
            },
          ],
        },
      },
    });

    const statusEmoji = orderData.status === 'ANNULEE' ? '❌' : '✅';
    console.log(`${statusEmoji} Feb ${orderData.day}: ${order.reference} - ${orderData.status} - ${orderData.totalHT}€`);
    orderCount++;
  }

  // Create January 2026 cancelled orders
  console.log('\n📅 Creating January 2026 cancellations...');
  for (const orderData of januaryCancellations) {
    const client = clients[orderData.clientIdx % clients.length];
    const product = products[orderCount % products.length];
    
    const orderDate = new Date(2026, 0, orderData.day, 10, 0, 0); // Month 0 = January
    const updatedAt = new Date(orderDate.getTime() + 4 * 60 * 60 * 1000);

    const quantity = Math.floor(Math.random() * 5) + 1;
    const unitPrice = orderData.totalHT / quantity;

    const reference = `CMD-JAN26-${orderData.day.toString().padStart(2, '0')}-ANN-${orderCount + 1}`;

    const order = await prisma.order.create({
      data: {
        tenantId: tenant.id,
        reference,
        clientId: client.id,
        ownerId: commercial.id,
        status: 'ANNULEE' as any,
        totalHT: orderData.totalHT,
        totalTTC: orderData.totalHT * 1.2,
        validatedAt: null,
        createdAt: orderDate,
        updatedAt,
        lines: {
          create: [
            {
              productId: product.id,
              productName: product.name,
              productCode: product.code,
              quantity,
              unitPrice,
            },
          ],
        },
      },
    });

    console.log(`❌ Jan ${orderData.day}: ${order.reference} - ANNULEE - ${orderData.totalHT}€`);
    orderCount++;
  }

  // Summary
  const febValidatedTotal = februaryOrders
    .filter(o => ['VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE'].includes(o.status))
    .reduce((sum, o) => sum + o.totalHT, 0);
  
  const febCancelledTotal = februaryOrders
    .filter(o => o.status === 'ANNULEE')
    .reduce((sum, o) => sum + o.totalHT, 0);

  const janCancelledTotal = januaryCancellations.reduce((sum, o) => sum + o.totalHT, 0);

  console.log('\n📊 Summary:');
  console.log(`   February 2026 (days 1-8):`);
  console.log(`     - Validated CA: ${febValidatedTotal.toLocaleString('fr-FR')} €`);
  console.log(`     - Cancelled CA: ${febCancelledTotal.toLocaleString('fr-FR')} €`);
  console.log(`   January 2026 (additional cancellations):`);
  console.log(`     - Cancelled CA: ${janCancelledTotal.toLocaleString('fr-FR')} €`);
  console.log('\n✅ Test orders created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
