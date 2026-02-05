import { Injectable, Logger } from '@nestjs/common';

interface GeocodingResult {
  latitude: number;
  longitude: number;
}

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);

  async geocodeAddress(
    address?: string,
    city?: string,
    postalCode?: string,
    country: string = 'France',
  ): Promise<GeocodingResult | null> {
    // Build multiple query variants for fallback
    const queries: string[] = [];
    
    // Try full address first
    if (address && city) {
      queries.push([address, postalCode, city, country].filter(Boolean).join(', '));
    }
    
    // Fallback: postal code + city + country
    if (postalCode && city) {
      queries.push([postalCode, city, country].filter(Boolean).join(', '));
    }
    
    // Fallback: city + country only
    if (city) {
      queries.push([city, country].filter(Boolean).join(', '));
    }
    
    // Fallback: postal code + country only
    if (postalCode) {
      queries.push([postalCode, country].filter(Boolean).join(', '));
    }

    if (queries.length === 0) {
      return null;
    }

    for (const query of queries) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'CDiagVet-CRM/1.0',
          },
        });

        if (!response.ok) {
          this.logger.warn(`Geocoding request failed: ${response.status}`);
          continue;
        }

        const data = await response.json();

        if (data && data.length > 0) {
          const result = data[0];
          this.logger.log(`Geocoded "${query}" -> [${result.lat}, ${result.lon}]`);
          return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
          };
        }

        this.logger.debug(`No result for: ${query}, trying fallback...`);
      } catch (error) {
        this.logger.error(`Geocoding error for "${query}": ${error}`);
      }
    }

    this.logger.warn(`No geocoding result for any query variant`);
    return null;
  }
}
