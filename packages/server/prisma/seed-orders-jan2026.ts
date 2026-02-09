import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating test orders for January 2026...');

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

  // Delete existing test orders for January 2026
  await prisma.orderLine.deleteMany({
    where: {
      order: {
        tenantId: tenant.id,
        createdAt: {
          gte: new Date('2026-01-01'),
          lt: new Date('2026-02-01'),
        },
      },
    },
  });

  await prisma.order.deleteMany({
    where: {
      tenantId: tenant.id,
      createdAt: {
        gte: new Date('2026-01-01'),
        lt: new Date('2026-02-01'),
      },
    },
  });

  console.log('🗑️  Cleaned up existing January 2026 orders');

  // Create orders for different days in January 2026
  const ordersData = [
    // First week - 3 orders
    { day: 3, clientIdx: 0, status: 'VALIDEE', totalHT: 1250.00 },
    { day: 5, clientIdx: 1, status: 'VALIDEE', totalHT: 890.50 },
    { day: 7, clientIdx: 2, status: 'LIVREE', totalHT: 2100.00 },
    
    // Second week - 4 orders
    { day: 10, clientIdx: 3, status: 'VALIDEE', totalHT: 1750.00 },
    { day: 12, clientIdx: 4, status: 'EXPEDIEE', totalHT: 3200.00 },
    { day: 14, clientIdx: 0, status: 'VALIDEE', totalHT: 950.00 },
    { day: 15, clientIdx: 1, status: 'LIVREE', totalHT: 1800.00 },
    
    // Third week - 5 orders
    { day: 17, clientIdx: 2, status: 'VALIDEE', totalHT: 2400.00 },
    { day: 19, clientIdx: 3, status: 'PREPARATION', totalHT: 1100.00 },
    { day: 20, clientIdx: 4, status: 'VALIDEE', totalHT: 675.00 },
    { day: 21, clientIdx: 0, status: 'LIVREE', totalHT: 4500.00 },
    { day: 22, clientIdx: 1, status: 'EXPEDIEE', totalHT: 1350.00 },
    
    // Fourth week - 4 orders
    { day: 24, clientIdx: 2, status: 'VALIDEE', totalHT: 2800.00 },
    { day: 27, clientIdx: 3, status: 'LIVREE', totalHT: 1950.00 },
    { day: 29, clientIdx: 4, status: 'VALIDEE', totalHT: 3100.00 },
    { day: 31, clientIdx: 0, status: 'PREPARATION', totalHT: 2250.00 },
    
    // Some orders in BROUILLON (should NOT count in CA)
    { day: 8, clientIdx: 1, status: 'BROUILLON', totalHT: 500.00 },
    { day: 16, clientIdx: 2, status: 'BROUILLON', totalHT: 750.00 },
    
    // Some ANNULEE orders (should NOT count in CA)
    { day: 11, clientIdx: 3, status: 'ANNULEE', totalHT: 1200.00 },
  ];

  let createdCount = 0;
  let totalCAValidated = 0;

  for (const orderData of ordersData) {
    const client = clients[orderData.clientIdx % clients.length];
    const orderDate = new Date(2026, 0, orderData.day, 10, 0, 0); // January 2026
    
    // validatedAt only for validated orders
    const validatedAt = ['VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE'].includes(orderData.status)
      ? orderDate
      : null;

    const reference = `CMD-2026-01-${String(createdCount + 1).padStart(4, '0')}`;
    
    const order = await prisma.order.create({
      data: {
        reference,
        clientId: client.id,
        ownerId: commercial.id,
        tenantId: tenant.id,
        status: orderData.status as any,
        totalHT: orderData.totalHT,
        totalTTC: orderData.totalHT * 1.20, // 20% TVA
        createdAt: orderDate,
        updatedAt: orderDate,
        validatedAt: validatedAt,
        lines: {
          create: [
            {
              productId: products[0].id,
              productName: products[0].name,
              quantity: Math.ceil(orderData.totalHT / products[0].unitPrice),
              unitPrice: products[0].unitPrice,
            },
          ],
        },
      },
    });

    createdCount++;
    
    if (['VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE'].includes(orderData.status)) {
      totalCAValidated += orderData.totalHT;
    }

    console.log(`   ✓ Order ${order.id.slice(0, 8)}... - ${orderData.day}/01/2026 - ${orderData.status} - ${orderData.totalHT}€`);
  }

  console.log('\n✅ Seed orders for January 2026 created:');
  console.log(`   - Total orders: ${createdCount}`);
  console.log(`   - CA Validated (should appear in dashboard): ${totalCAValidated.toFixed(2)}€`);
  console.log(`   - Orders in BROUILLON (excluded): 2`);
  console.log(`   - Orders ANNULEE (excluded): 1`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
