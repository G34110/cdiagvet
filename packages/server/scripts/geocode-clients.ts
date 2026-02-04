import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function geocodeAddress(
  address?: string | null,
  city?: string | null,
  postalCode?: string | null,
): Promise<{ latitude: number; longitude: number } | null> {
  const parts = [address, postalCode, city, 'France'].filter(Boolean);
  if (parts.length < 2) return null;

  const query = parts.join(', ');
  console.log(`  Geocoding: "${query}"`);

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CDiagVet-CRM/1.0' },
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch (error) {
    console.error(`  Error: ${error}`);
    return null;
  }
}

async function main() {
  console.log('🔄 Geocoding all clients with addresses...\n');

  const clients = await prisma.client.findMany({
    where: {
      deletedAt: null,
      OR: [
        { address: { not: null } },
        { city: { not: null } },
      ],
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      postalCode: true,
      latitude: true,
      longitude: true,
    },
  });

  console.log(`Found ${clients.length} clients to process\n`);

  let updated = 0;
  let skipped = 0;

  for (const client of clients) {
    console.log(`📍 ${client.name}`);

    // Skip if already has coordinates
    if (client.latitude && client.longitude) {
      console.log(`  Already has coordinates: [${client.latitude}, ${client.longitude}]\n`);
      skipped++;
      continue;
    }

    const coords = await geocodeAddress(client.address, client.city, client.postalCode);

    if (coords) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });
      console.log(`  ✅ Updated: [${coords.latitude}, ${coords.longitude}]\n`);
      updated++;
    } else {
      console.log(`  ❌ No result\n`);
    }

    // Rate limiting - Nominatim requires max 1 request per second
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  console.log(`\n✅ Done! Updated: ${updated}, Skipped: ${skipped}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
