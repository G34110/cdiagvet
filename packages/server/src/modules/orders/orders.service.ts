import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOrderInput, CreateOrderLineInput } from './dto/create-order.input';
import { UpdateOrderInput, UpdateOrderStatusInput } from './dto/update-order.input';
import { OrderStatus } from './entities/order.entity';

interface RequestContext {
  userId: string;
  tenantId: string;
  role: string;
  clientId?: string;
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private async generateReference(_tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `CMD-${year}-`;
    
    // Find the max sequence number globally (reference is unique across all tenants)
    const orders = await this.prisma.order.findMany({
      where: {
        reference: { startsWith: prefix },
      },
      select: { reference: true },
    });
    
    let maxSequence = 0;
    for (const order of orders) {
      const match = order.reference.match(/CMD-\d{4}-(\d+)/);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (seq > maxSequence) {
          maxSequence = seq;
        }
      }
    }
    
    const nextSequence = maxSequence + 1;
    return `${prefix}${String(nextSequence).padStart(5, '0')}`;
  }

  private calculateTotals(lines: { quantity: number; unitPrice: number }[], taxRate: number) {
    const totalHT = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
    const totalTTC = totalHT * (1 + taxRate / 100);
    return { totalHT, totalTTC };
  }

  async findAll(ctx: RequestContext) {
    const where: any = { tenantId: ctx.tenantId };

    if (ctx.role === 'COMMERCIAL') {
      where.ownerId = ctx.userId;
    } else if (ctx.role === 'DISTRIBUTEUR' && ctx.clientId) {
      where.clientId = ctx.clientId;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStatus(ctx: RequestContext, status: OrderStatus) {
    const where: any = { tenantId: ctx.tenantId, status };

    if (ctx.role === 'COMMERCIAL') {
      where.ownerId = ctx.userId;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(ctx: RequestContext, clientId: string) {
    const where: any = { tenantId: ctx.tenantId, clientId };

    if (ctx.role === 'COMMERCIAL') {
      where.ownerId = ctx.userId;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ctx: RequestContext, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        client: true,
        owner: true,
        opportunity: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Commande ${id} non trouvée`);
    }

    if (ctx.role === 'COMMERCIAL' && order.ownerId !== ctx.userId) {
      throw new ForbiddenException('Accès non autorisé à cette commande');
    }

    return order;
  }

  async create(ctx: RequestContext, input: CreateOrderInput) {
    const lines = input.lines || [];
    const { totalHT, totalTTC } = this.calculateTotals(lines, 20);

    // Retry loop to handle unique constraint conflicts
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const reference = await this.generateReference(ctx.tenantId);
      try {
        return await this.prisma.order.create({
          data: {
            reference,
            clientId: input.clientId,
            ownerId: ctx.userId,
            tenantId: ctx.tenantId,
            notes: input.notes,
            expectedDelivery: input.expectedDelivery,
            totalHT,
            totalTTC,
            taxRate: 20,
            lines: {
              create: lines.map(line => ({
                productName: line.productName,
                productCode: line.productCode,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                productId: line.productId,
                kitId: line.kitId,
              })),
            },
          },
          include: {
            client: true,
            owner: true,
            lines: { orderBy: { createdAt: 'asc' } },
          },
        });
      } catch (error: any) {
        if (error.code === 'P2002' && attempt < maxRetries - 1) {
          // Unique constraint failed, retry with new reference
          continue;
        }
        throw error;
      }
    }
    throw new BadRequestException('Impossible de générer une référence unique pour la commande');
  }

  async createFromOpportunity(
    ctx: RequestContext,
    opportunityId: string,
    opportunityLines: { productName: string; quantity: number; unitPrice: number; productId?: string; kitId?: string }[],
    clientId: string,
    manualAmount: number = 0,
  ) {
    const linesTotals = this.calculateTotals(opportunityLines, 20);
    const totalHT = linesTotals.totalHT + manualAmount;
    const totalTTC = totalHT * 1.2;

    // Retry loop to handle unique constraint conflicts
    const maxRetries = 5;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const reference = await this.generateReference(ctx.tenantId);
      try {
        return await this.prisma.order.create({
          data: {
            reference,
            clientId,
            ownerId: ctx.userId,
            tenantId: ctx.tenantId,
            opportunityId,
            totalHT,
            totalTTC,
            taxRate: 20,
            manualAmount,
            status: 'BROUILLON',
            lines: {
              create: opportunityLines.map(line => ({
                productName: line.productName,
                quantity: line.quantity,
                unitPrice: line.unitPrice,
                productId: line.productId || null,
                kitId: line.kitId || null,
              })),
            },
          },
          include: {
            client: true,
            owner: true,
            opportunity: true,
            lines: { orderBy: { createdAt: 'asc' } },
          },
        });
      } catch (error: any) {
        if (error.code === 'P2002' && attempt < maxRetries - 1) {
          continue;
        }
        throw error;
      }
    }
    throw new BadRequestException('Impossible de générer une référence unique pour la commande');
  }

  async update(ctx: RequestContext, input: UpdateOrderInput) {
    const order = await this.findOne(ctx, input.id);

    if (order.status !== 'BROUILLON') {
      throw new BadRequestException('Seules les commandes en brouillon peuvent être modifiées');
    }

    const data: any = {};
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.expectedDelivery !== undefined) data.expectedDelivery = input.expectedDelivery;
    if (input.trackingNumber !== undefined) data.trackingNumber = input.trackingNumber;
    if (input.taxRate !== undefined) {
      data.taxRate = input.taxRate;
      data.totalTTC = order.totalHT * (1 + input.taxRate / 100);
    }

    return this.prisma.order.update({
      where: { id: input.id },
      data,
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async updateStatus(ctx: RequestContext, input: UpdateOrderStatusInput) {
    const order = await this.findOne(ctx, input.id);

    const data: any = { status: input.status };

    if (input.status === 'VALIDEE') {
      data.validatedAt = new Date();
    }

    if (input.status === 'LIVREE') {
      data.deliveredAt = new Date();
    }

    if (input.trackingNumber) {
      data.trackingNumber = input.trackingNumber;
    }

    return this.prisma.order.update({
      where: { id: input.id },
      data,
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async validate(ctx: RequestContext, id: string) {
    const order = await this.findOne(ctx, id);

    if (order.status !== 'BROUILLON') {
      throw new BadRequestException('Seules les commandes en brouillon peuvent être validées');
    }

    if (!order.lines || order.lines.length === 0) {
      throw new BadRequestException('La commande doit contenir au moins une ligne');
    }

    return this.prisma.order.update({
      where: { id },
      data: {
        status: 'VALIDEE',
        validatedAt: new Date(),
      },
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async cancel(ctx: RequestContext, id: string) {
    const order = await this.findOne(ctx, id);

    if (order.status === 'LIVREE') {
      throw new BadRequestException('Impossible d\'annuler une commande livrée');
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: 'ANNULEE' },
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async delete(ctx: RequestContext, id: string) {
    const order = await this.findOne(ctx, id);

    if (order.status !== 'BROUILLON' && order.status !== 'ANNULEE') {
      throw new BadRequestException('Seules les commandes en brouillon ou annulées peuvent être supprimées');
    }

    await this.prisma.order.delete({ where: { id } });
    return true;
  }

  async addLine(ctx: RequestContext, orderId: string, line: CreateOrderLineInput) {
    const order = await this.findOne(ctx, orderId);

    if (order.status !== 'BROUILLON') {
      throw new BadRequestException('Impossible d\'ajouter une ligne à une commande validée');
    }

    await this.prisma.orderLine.create({
      data: {
        orderId,
        productName: line.productName,
        productCode: line.productCode,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        productId: line.productId,
        kitId: line.kitId,
      },
    });

    return this.recalculateTotals(orderId);
  }

  async updateLine(ctx: RequestContext, lineId: string, quantity: number) {
    const line = await this.prisma.orderLine.findUnique({
      where: { id: lineId },
      include: { order: true },
    });

    if (!line) {
      throw new NotFoundException('Ligne non trouvée');
    }

    await this.findOne(ctx, line.orderId);

    if (line.order.status !== 'BROUILLON') {
      throw new BadRequestException('Impossible de modifier une ligne sur une commande validée');
    }

    await this.prisma.orderLine.update({
      where: { id: lineId },
      data: { quantity },
    });

    return this.recalculateTotals(line.orderId);
  }

  async removeLine(ctx: RequestContext, lineId: string) {
    const line = await this.prisma.orderLine.findUnique({
      where: { id: lineId },
      include: { order: true },
    });

    if (!line) {
      throw new NotFoundException('Ligne non trouvée');
    }

    await this.findOne(ctx, line.orderId);

    if (line.order.status !== 'BROUILLON') {
      throw new BadRequestException('Impossible de supprimer une ligne sur une commande validée');
    }

    await this.prisma.orderLine.delete({ where: { id: lineId } });

    return this.recalculateTotals(line.orderId);
  }

  private async recalculateTotals(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { lines: true },
    });

    if (!order) {
      throw new NotFoundException('Commande non trouvée');
    }

    const { totalHT, totalTTC } = this.calculateTotals(order.lines, order.taxRate);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { totalHT, totalTTC },
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
    });
  }
}
