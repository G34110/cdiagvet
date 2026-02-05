import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function geocodeAddress(
  address?: string | null,
  city?: string | null,
  postalCode?: string | null,
  country: string = 'France',
): Promise<{ latitude: number; longitude: number } | null> {
  const queries: string[] = [];
  
  if (address && city) {
    queries.push([address, postalCode, city, country].filter(Boolean).join(', '));
  }
  if (postalCode && city) {
    queries.push([postalCode, city, country].filter(Boolean).join(', '));
  }
  if (city) {
    queries.push([city, country].filter(Boolean).join(', '));
  }
  if (postalCode) {
    queries.push([postalCode, country].filter(Boolean).join(', '));
  }

  for (const query of queries) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'CDiagVet-CRM/1.0' },
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data && data.length > 0) {
        console.log(`  ✓ Geocoded "${query}" -> [${data[0].lat}, ${data[0].lon}]`);
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
      }
    } catch (error) {
      console.error(`  ✗ Error for "${query}":`, error);
    }
    
    // Rate limiting for Nominatim
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return null;
}

async function main() {
  const clientsWithoutCoords = await prisma.client.findMany({
    where: {
      deletedAt: null,
      OR: [
        { latitude: null },
        { longitude: null },
      ],
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      postalCode: true,
    },
  });

  console.log(`Found ${clientsWithoutCoords.length} clients without coordinates\n`);

  for (const client of clientsWithoutCoords) {
    console.log(`Processing: ${client.name}`);
    
    const coords = await geocodeAddress(
      client.address,
      client.city,
      client.postalCode,
    );

    if (coords) {
      await prisma.client.update({
        where: { id: client.id },
        data: {
          latitude: coords.latitude,
          longitude: coords.longitude,
        },
      });
      console.log(`  Updated with coords: [${coords.latitude}, ${coords.longitude}]\n`);
    } else {
      console.log(`  ✗ Could not geocode\n`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('Done!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
