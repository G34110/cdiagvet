import { Injectable, Logger } from '@nestjs/common';

export interface GS1DecodedData {
  gtin: string;
  lotNumber: string;
  expirationDate?: Date;
  serialNumber?: string;
  rawBarcode: string;
}

export interface GS1DecodeResult {
  success: boolean;
  data?: GS1DecodedData;
  error?: string;
}

@Injectable()
export class GS1DecoderService {
  private readonly logger = new Logger(GS1DecoderService.name);

  // GS1 Application Identifiers
  private readonly AI = {
    GTIN: '01',           // Global Trade Item Number (14 digits)
    LOT: '10',            // Batch/Lot Number (variable, up to 20 chars)
    EXPIRY_YYMMDD: '17',  // Expiration Date YYMMDD
    SERIAL: '21',         // Serial Number (variable, up to 20 chars)
  };

  decode(barcode: string): GS1DecodeResult {
    try {
      // Remove FNC1 character if present (often represented as ]C1 or GS char)
      let data = barcode.replace(/^\]C1/, '').replace(/\x1D/g, '').trim();
      
      this.logger.debug(`Decoding GS1.128: ${data}`);

      if (!data || data.length < 16) {
        return {
          success: false,
          error: `Code-barres trop court. Minimum 16 caractères requis (reçu: ${data.length}). Format attendu: 01[GTIN-14]17[YYMMDD]10[LOT]`,
        };
      }

      let gtin: string | null = null;
      let lotNumber: string | null = null;
      let expirationDate: Date | undefined;
      let serialNumber: string | undefined;

      // Parse GTIN (AI 01) - always 14 digits
      if (!data.startsWith('01')) {
        return {
          success: false,
          error: `Le code-barres doit commencer par "01" (identifiant GTIN). Reçu: "${data.substring(0, 2)}". Format: 01[GTIN-14]17[YYMMDD]10[LOT]`,
        };
      }

      const gtinMatch = data.match(/^01(\d{14})/);
      if (!gtinMatch) {
        const digits = data.substring(2).match(/^\d+/)?.[0] || '';
        return {
          success: false,
          error: `Le GTIN doit contenir exactement 14 chiffres après "01". Trouvé: ${digits.length} chiffres ("${digits.substring(0, 20)}...")`,
        };
      }
      
      gtin = gtinMatch[1];
      data = data.substring(16); // Remove 01 + 14 digits

      // Parse remaining data for 17 (expiry) and 10 (lot)
      let remaining = data;

      // Parse Expiration Date (AI 17) - YYMMDD format
      const expiryMatch = remaining.match(/17(\d{6})/);
      if (expiryMatch) {
        const yymmdd = expiryMatch[1];
        const year = 2000 + parseInt(yymmdd.substring(0, 2));
        const month = parseInt(yymmdd.substring(2, 4)) - 1;
        const day = parseInt(yymmdd.substring(4, 6)) || 1;
        expirationDate = new Date(year, month, day);
        remaining = remaining.replace(`17${yymmdd}`, '');
      }

      // Parse Lot Number (AI 10) - variable length
      const lotMatch = remaining.match(/10([A-Za-z0-9]+)/);
      if (lotMatch) {
        lotNumber = lotMatch[1];
        remaining = remaining.replace(`10${lotNumber}`, '');
      }

      // Parse Serial Number (AI 21) - variable length
      const serialMatch = remaining.match(/21([^\x1D]+)/);
      if (serialMatch) {
        serialNumber = serialMatch[1];
      }

      // Validate required fields
      if (!lotNumber) {
        return {
          success: false,
          error: `Numéro de lot manquant. Le code doit contenir "10" suivi du numéro de lot. Données après GTIN: "${data}". Format attendu: ...17[YYMMDD]10[LOT]`,
        };
      }

      this.logger.log(`Decoded: GTIN=${gtin}, Lot=${lotNumber}, Exp=${expirationDate?.toISOString()}`);

      return {
        success: true,
        data: {
          gtin,
          lotNumber,
          expirationDate,
          serialNumber,
          rawBarcode: barcode,
        },
      };
    } catch (error) {
      this.logger.error(`GS1 decode error: ${error}`);
      return {
        success: false,
        error: `Erreur de décodage: ${error.message}`,
      };
    }
  }

  // Validate GTIN checksum (optional validation)
  validateGtin(gtin: string): boolean {
    if (gtin.length !== 14) return false;
    
    const digits = gtin.split('').map(Number);
    const checkDigit = digits.pop()!;
    
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }
    
    const calculatedCheck = (10 - (sum % 10)) % 10;
    return calculatedCheck === checkDigit;
  }
}
