import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GS1DecoderService } from './gs1-decoder.service';

@Injectable()
export class LotsService {
  private readonly logger = new Logger(LotsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gs1Decoder: GS1DecoderService,
  ) {}

  async scanAndCreateLot(barcode: string, productName?: string) {
    const result = this.gs1Decoder.decode(barcode);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        message: result.error || 'Code-barres GS1.128 invalide ou non reconnu',
        isNewProduct: false,
      };
    }

    const decoded = result.data;

    // Find or create product
    let product = await this.prisma.product.findUnique({
      where: { gtin: decoded.gtin },
    });

    let isNewProduct = false;
    if (!product) {
      isNewProduct = true;
      // Get a default tenant for barcode-scanned products
      const defaultTenant = await this.prisma.tenant.findFirst();
      if (!defaultTenant) {
        return {
          success: false,
          message: 'Aucun tenant configuré',
          isNewProduct: false,
        };
      }
      product = await this.prisma.product.create({
        data: {
          code: `SCAN-${decoded.gtin}`,
          gtin: decoded.gtin,
          name: productName || `Produit ${decoded.gtin}`,
          tenantId: defaultTenant.id,
        },
      });
      this.logger.log(`Created new product: ${product.name} (GTIN: ${decoded.gtin})`);
    }

    // Find or create lot
    let lot = await this.prisma.lot.findUnique({
      where: {
        productId_lotNumber: {
          productId: product.id,
          lotNumber: decoded.lotNumber,
        },
      },
      include: { product: true },
    });

    if (!lot) {
      lot = await this.prisma.lot.create({
        data: {
          lotNumber: decoded.lotNumber,
          expirationDate: decoded.expirationDate,
          rawBarcode: decoded.rawBarcode,
          productId: product.id,
        },
        include: { product: true },
      });
      this.logger.log(`Created new lot: ${decoded.lotNumber} for product ${product.name}`);
    }

    return {
      success: true,
      message: isNewProduct 
        ? 'Nouveau produit et lot créés' 
        : 'Lot scanné avec succès',
      lot,
      gtin: decoded.gtin,
      lotNumber: decoded.lotNumber,
      expirationDate: decoded.expirationDate,
      productName: product.name,
      isNewProduct,
    };
  }

  async associateLotToClient(lotId: string, clientId: string, quantity: number = 1, deliveryDate?: Date) {
    const lotClient = await this.prisma.lotClient.create({
      data: {
        lotId,
        clientId,
        quantity,
        deliveryDate: deliveryDate || new Date(),
      },
      include: {
        lot: { include: { product: true } },
        client: true,
      },
    });

    this.logger.log(`Associated lot ${lotClient.lot.lotNumber} to client ${lotClient.client.name}`);
    
    return {
      ...lotClient,
      clientName: lotClient.client.name,
    };
  }

  async getLotTraceability(lotId: string) {
    const lot = await this.prisma.lot.findUnique({
      where: { id: lotId },
      include: { product: true },
    });

    if (!lot) {
      throw new Error('Lot non trouvé');
    }

    const deliveries = await this.prisma.lotClient.findMany({
      where: { lotId },
      include: {
        lot: { include: { product: true } },
        client: true,
      },
      orderBy: { deliveryDate: 'desc' },
    });

    const totalQuantity = deliveries.reduce((sum, d) => sum + d.quantity, 0);
    const clientCount = new Set(deliveries.map(d => d.clientId)).size;

    return {
      lot,
      deliveries: deliveries.map(d => ({
        ...d,
        clientName: d.client.name,
        clientAddress: d.client.addressLine1,
        clientCity: d.client.city,
        clientPostalCode: d.client.postalCode,
      })),
      totalQuantity,
      clientCount,
    };
  }

  async searchLots(query: string, tenantId: string) {
    return this.prisma.lot.findMany({
      where: {
        OR: [
          { lotNumber: { contains: query, mode: 'insensitive' } },
          { product: { gtin: { contains: query, mode: 'insensitive' } } },
          { product: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: { product: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getClientLots(clientId: string) {
    const lotClients = await this.prisma.lotClient.findMany({
      where: { clientId },
      include: {
        lot: { include: { product: true } },
      },
      orderBy: { deliveryDate: 'desc' },
    });

    return lotClients.map(lc => ({
      ...lc,
      clientName: undefined,
    }));
  }

  async findLotById(id: string) {
    return this.prisma.lot.findUnique({
      where: { id },
      include: { product: true },
    });
  }

  async findLotByGtinAndNumber(gtin: string, lotNumber: string) {
    return this.prisma.lot.findFirst({
      where: {
        lotNumber,
        product: { gtin },
      },
      include: { product: true },
    });
  }

  async getAllLots(search?: string) {
    const where = search
      ? {
          OR: [
            { lotNumber: { contains: search, mode: 'insensitive' as const } },
            { product: { gtin: { contains: search, mode: 'insensitive' as const } } },
            { product: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {};

    return this.prisma.lot.findMany({
      where,
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
