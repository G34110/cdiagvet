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
    const parts = [address, postalCode, city, country].filter(Boolean);
    if (parts.length < 2) {
      return null;
    }

    const query = parts.join(', ');

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CDiagVet-CRM/1.0',
        },
      });

      if (!response.ok) {
        this.logger.warn(`Geocoding request failed: ${response.status}`);
        return null;
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

      this.logger.warn(`No geocoding result for: ${query}`);
      return null;
    } catch (error) {
      this.logger.error(`Geocoding error: ${error}`);
      return null;
    }
  }
}
