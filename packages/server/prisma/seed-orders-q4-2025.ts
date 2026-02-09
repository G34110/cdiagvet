import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating test orders for Q4 2025 (Oct, Nov, Dec)...');

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

  // Delete existing test orders for Q4 2025
  await prisma.orderLine.deleteMany({
    where: {
      order: {
        tenantId: tenant.id,
        createdAt: {
          gte: new Date('2025-10-01'),
          lt: new Date('2026-01-01'),
        },
      },
    },
  });

  await prisma.order.deleteMany({
    where: {
      tenantId: tenant.id,
      createdAt: {
        gte: new Date('2025-10-01'),
        lt: new Date('2026-01-01'),
      },
    },
  });

  console.log('🗑️  Cleaned up existing Q4 2025 orders');

  // Orders data: mix of validated and cancelled orders across Q4 2025
  const ordersData = [
    // OCTOBER 2025
    { month: 10, day: 5, clientIdx: 0, status: 'VALIDEE', totalHT: 1500.00 },
    { month: 10, day: 8, clientIdx: 1, status: 'LIVREE', totalHT: 2200.00 },
    { month: 10, day: 12, clientIdx: 2, status: 'ANNULEE', totalHT: 800.00 },
    { month: 10, day: 15, clientIdx: 3, status: 'EXPEDIEE', totalHT: 3100.00 },
    { month: 10, day: 20, clientIdx: 4, status: 'VALIDEE', totalHT: 1800.00 },
    { month: 10, day: 25, clientIdx: 5, status: 'ANNULEE', totalHT: 950.00 },
    { month: 10, day: 28, clientIdx: 6, status: 'LIVREE', totalHT: 2750.00 },

    // NOVEMBER 2025
    { month: 11, day: 3, clientIdx: 0, status: 'VALIDEE', totalHT: 1350.00 },
    { month: 11, day: 7, clientIdx: 1, status: 'ANNULEE', totalHT: 1100.00 },
    { month: 11, day: 10, clientIdx: 2, status: 'LIVREE', totalHT: 4200.00 },
    { month: 11, day: 14, clientIdx: 3, status: 'EXPEDIEE', totalHT: 1900.00 },
    { month: 11, day: 18, clientIdx: 4, status: 'VALIDEE', totalHT: 2600.00 },
    { month: 11, day: 22, clientIdx: 5, status: 'ANNULEE', totalHT: 750.00 },
    { month: 11, day: 26, clientIdx: 6, status: 'PREPARATION', totalHT: 3300.00 },
    { month: 11, day: 29, clientIdx: 7, status: 'LIVREE', totalHT: 1450.00 },

    // DECEMBER 2025
    { month: 12, day: 2, clientIdx: 0, status: 'VALIDEE', totalHT: 2100.00 },
    { month: 12, day: 5, clientIdx: 1, status: 'ANNULEE', totalHT: 1650.00 },
    { month: 12, day: 9, clientIdx: 2, status: 'EXPEDIEE', totalHT: 3800.00 },
    { month: 12, day: 12, clientIdx: 3, status: 'LIVREE', totalHT: 2950.00 },
    { month: 12, day: 15, clientIdx: 4, status: 'ANNULEE', totalHT: 1200.00 },
    { month: 12, day: 18, clientIdx: 5, status: 'VALIDEE', totalHT: 4100.00 },
    { month: 12, day: 22, clientIdx: 6, status: 'LIVREE', totalHT: 1750.00 },
    { month: 12, day: 26, clientIdx: 7, status: 'EXPEDIEE', totalHT: 2300.00 },
    { month: 12, day: 30, clientIdx: 8, status: 'ANNULEE', totalHT: 890.00 },
  ];

  let orderCount = 0;

  for (const orderData of ordersData) {
    const client = clients[orderData.clientIdx % clients.length];
    const product = products[orderCount % products.length];
    
    const orderDate = new Date(2025, orderData.month - 1, orderData.day, 10, 0, 0);
    const validatedAt = orderData.status !== 'BROUILLON' && orderData.status !== 'ANNULEE' 
      ? new Date(orderDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours after creation
      : null;

    // For cancelled orders, set updatedAt to the cancellation date (same day, few hours later)
    const updatedAt = orderData.status === 'ANNULEE'
      ? new Date(orderDate.getTime() + 4 * 60 * 60 * 1000) // 4 hours after creation
      : orderDate;

    const quantity = Math.floor(Math.random() * 5) + 1;
    const unitPrice = orderData.totalHT / quantity;

    const reference = `CMD-Q4-${orderData.month.toString().padStart(2, '0')}-${orderData.day.toString().padStart(2, '0')}-${orderCount + 1}`;

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
    console.log(`${statusEmoji} Created order ${order.reference} - ${orderData.status} - ${orderData.totalHT}€`);
    orderCount++;
  }

  // Summary
  const validatedTotal = ordersData
    .filter(o => ['VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE'].includes(o.status))
    .reduce((sum, o) => sum + o.totalHT, 0);
  
  const cancelledTotal = ordersData
    .filter(o => o.status === 'ANNULEE')
    .reduce((sum, o) => sum + o.totalHT, 0);

  console.log('\n📊 Summary Q4 2025:');
  console.log(`   Total orders: ${orderCount}`);
  console.log(`   Validated CA: ${validatedTotal.toLocaleString('fr-FR')} €`);
  console.log(`   Cancelled CA: ${cancelledTotal.toLocaleString('fr-FR')} € (in red)`);
  console.log('\n✅ Q4 2025 test orders created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
