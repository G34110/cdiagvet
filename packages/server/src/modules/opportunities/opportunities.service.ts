import { Injectable, ForbiddenException, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOpportunityInput } from './dto/create-opportunity.input';
import { UpdateOpportunityInput } from './dto/update-opportunity.input';
import { AddOpportunityNoteInput } from './dto/add-opportunity-note.input';
import { OrdersService } from '../orders/orders.service';
import { OpportunityEventType } from './entities/opportunity.entity';

interface OpportunityContext {
  tenantId: string;
  userId: string;
  role: string;
  filiereIds?: string[];
}

const STATUS_PROBABILITY: Record<string, number> = {
  NOUVEAU: 10,
  QUALIFICATION: 25,
  PROPOSITION: 50,
  NEGOCIATION: 75,
  GAGNE: 100,
  PERDU: 0,
};

const STATUS_ORDER: Record<string, number> = {
  NOUVEAU: 0,
  QUALIFICATION: 1,
  PROPOSITION: 2,
  NEGOCIATION: 3,
  GAGNE: 4,
  PERDU: 5,
};

@Injectable()
export class OpportunitiesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
  ) {}

  private buildWhereClause(ctx: OpportunityContext) {
    const baseWhere: any = { tenantId: ctx.tenantId };

    if (ctx.role === 'COMMERCIAL') {
      baseWhere.ownerId = ctx.userId;
    } else if (ctx.role === 'RESPONSABLE_FILIERE' && ctx.filiereIds?.length) {
      baseWhere.client = {
        filieres: {
          some: {
            filiereId: { in: ctx.filiereIds },
          },
        },
      };
    }

    return baseWhere;
  }

  async findAll(ctx: OpportunityContext) {
    const where = this.buildWhereClause(ctx);

    const opportunities = await this.prisma.opportunity.findMany({
      where,
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return opportunities.map(opp => ({
      ...opp,
      weightedAmount: opp.amount * (opp.probability / 100),
      lines: opp.lines.map(line => ({
        ...line,
        total: line.quantity * line.unitPrice,
      })),
    }));
  }

  async findByStatus(ctx: OpportunityContext, status: string) {
    const where = {
      ...this.buildWhereClause(ctx),
      status: status as any,
    };

    const opportunities = await this.prisma.opportunity.findMany({
      where,
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { expectedCloseDate: 'asc' },
    });

    return opportunities.map(opp => ({
      ...opp,
      weightedAmount: opp.amount * (opp.probability / 100),
      lines: opp.lines.map(line => ({
        ...line,
        total: line.quantity * line.unitPrice,
      })),
    }));
  }

  async findOne(ctx: OpportunityContext, id: string) {
    // First try with full access control
    let opportunity = await this.prisma.opportunity.findFirst({
      where: {
        id,
        ...this.buildWhereClause(ctx),
      },
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
    });

    // If not found with access control, check if it exists at all (for debugging)
    if (!opportunity) {
      const exists = await this.prisma.opportunity.findFirst({
        where: { id, tenantId: ctx.tenantId },
        select: { id: true, ownerId: true },
      });
      if (exists) {
        console.log('Opportunity exists but access denied:', { 
          oppId: id, 
          oppOwnerId: exists.ownerId,
          userId: ctx.userId, 
          role: ctx.role,
          filiereIds: ctx.filiereIds 
        });
      }
      throw new NotFoundException('Opportunité non trouvée');
    }

    // Règle: Si date de clôture dépassée et statut ni GAGNE, ni CONVERTI, ni PERDU -> passer en PERDU
    const now = new Date();
    const closeDate = new Date(opportunity.expectedCloseDate);
    const excludedStatuses = ['GAGNE', 'CONVERTI', 'PERDU'];
    
    if (closeDate < now && !excludedStatuses.includes(opportunity.status)) {
      opportunity = await this.prisma.opportunity.update({
        where: { id },
        data: { 
          status: 'PERDU',
          lostReason: 'Date de clôture dépassée',
          probability: 0,
        },
        include: {
          client: true,
          owner: true,
          lines: { orderBy: { createdAt: 'asc' } },
        },
      });
    }

    return {
      ...opportunity,
      weightedAmount: opportunity.amount * (opportunity.probability / 100),
      lines: opportunity.lines.map(line => ({
        ...line,
        total: line.quantity * line.unitPrice,
      })),
    };
  }

  async create(ctx: OpportunityContext, input: CreateOpportunityInput) {
    // Verify client belongs to user's scope
    const client = await this.prisma.client.findFirst({
      where: {
        id: input.clientId,
        tenantId: ctx.tenantId,
        ...(ctx.role === 'COMMERCIAL' ? { commercialId: ctx.userId } : {}),
      },
    });

    if (!client) {
      throw new ForbiddenException('Client non accessible');
    }

    const probability = input.probability ?? STATUS_PROBABILITY['NOUVEAU'];

    // Admin/Responsable can assign to a specific commercial, otherwise self
    let ownerId = ctx.userId;
    
    // Verify the current user exists
    const currentUser = await this.prisma.user.findFirst({
      where: { id: ctx.userId, tenantId: ctx.tenantId },
    });
    if (!currentUser) {
      throw new ForbiddenException('Utilisateur non trouvé');
    }
    
    if (input.ownerId && (ctx.role === 'ADMIN' || ctx.role === 'RESPONSABLE_FILIERE')) {
      // Verify the target owner exists and is a commercial
      const targetOwner = await this.prisma.user.findFirst({
        where: {
          id: input.ownerId,
          tenantId: ctx.tenantId,
          role: 'COMMERCIAL',
        },
      });
      if (targetOwner) {
        ownerId = input.ownerId;
      }
    }

    const manualAmount = input.manualAmount ?? 0;
    const totalAmount = input.amount ?? manualAmount;
    const opportunity = await this.prisma.opportunity.create({
      data: {
        title: input.title,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        source: input.source as any,
        amount: totalAmount,
        manualAmount: manualAmount,
        probability,
        expectedCloseDate: new Date(input.expectedCloseDate),
        notes: input.notes,
        clientId: input.clientId,
        ownerId,
        tenantId: ctx.tenantId,
      } as any,
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Create CREATED event
    await this.createEvent(opportunity.id, OpportunityEventType.CREATED, ctx.userId,
      `Opportunité créée: ${input.title}`);

    return {
      ...opportunity,
      weightedAmount: opportunity.amount * (opportunity.probability / 100),
      lines: [],
    };
  }

  async update(ctx: OpportunityContext, input: UpdateOpportunityInput) {
    // Check access
    const existing = await this.findOne(ctx, input.id);

    // Only owner can modify (unless admin/responsable)
    if (ctx.role === 'COMMERCIAL' && existing.ownerId !== ctx.userId) {
      throw new ForbiddenException('Seul le propriétaire peut modifier cette opportunité');
    }

    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.contactName !== undefined) updateData.contactName = input.contactName;
    if (input.contactEmail !== undefined) updateData.contactEmail = input.contactEmail;
    if (input.contactPhone !== undefined) updateData.contactPhone = input.contactPhone;
    if (input.source !== undefined) updateData.source = input.source;
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.manualAmount !== undefined) updateData.manualAmount = input.manualAmount;
    if (input.expectedCloseDate !== undefined) updateData.expectedCloseDate = new Date(input.expectedCloseDate);
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.ownerId !== undefined) updateData.ownerId = input.ownerId;

    // Handle status change with probability history tracking
    if (input.status !== undefined && input.status !== existing.status) {
      // Save current probability to history for current status before changing
      const history = (existing.probabilityHistory as Record<string, number>) || {};
      history[existing.status] = existing.probability;
      updateData.probabilityHistory = history;
      
      updateData.status = input.status;
      
      // Check if we have a saved probability for the new status
      if (!input.probability) {
        if (history[input.status] !== undefined) {
          // Restore saved probability for this status
          updateData.probability = history[input.status];
        } else {
          // No history: use default probability for the new status
          updateData.probability = STATUS_PROBABILITY[input.status] ?? existing.probability;
        }
      }
      
      if (input.status === 'PERDU') {
        updateData.lostReason = input.lostReason;
        updateData.lostComment = input.lostComment;
      }
    }

    // Explicit probability update always takes precedence
    if (input.probability !== undefined) updateData.probability = input.probability;

    await this.prisma.opportunity.update({
      where: { id: input.id },
      data: updateData,
    });

    // Create events for tracked changes
    if (input.status !== undefined && input.status !== existing.status) {
      await this.createEvent(input.id, OpportunityEventType.STATUS_CHANGE, ctx.userId,
        `Statut: ${existing.status} → ${input.status}`,
        { oldStatus: existing.status, newStatus: input.status });
    }

    if (input.amount !== undefined && input.amount !== existing.amount) {
      await this.createEvent(input.id, OpportunityEventType.AMOUNT_CHANGE, ctx.userId,
        `Montant: ${existing.amount}€ → ${input.amount}€`,
        { oldAmount: existing.amount, newAmount: input.amount });
    }

    // If manualAmount was updated, recalculate total amount
    if (input.manualAmount !== undefined) {
      await this.recalculateOpportunityAmount(input.id);
    }

    // Fetch and return updated opportunity
    return this.findOne(ctx, input.id);
  }

  async updateStatus(ctx: OpportunityContext, id: string, status: string, lostReason?: string, lostComment?: string) {
    return this.update(ctx, {
      id,
      status,
      lostReason,
      lostComment,
    });
  }

  async getStats(ctx: OpportunityContext) {
    const where = this.buildWhereClause(ctx);

    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        ...where,
        status: { notIn: ['GAGNE', 'PERDU'] },
      },
    });

    const totalPipeline = opportunities.reduce((sum, opp) => sum + opp.amount, 0);
    const weightedPipeline = opportunities.reduce(
      (sum, opp) => sum + opp.amount * (opp.probability / 100),
      0,
    );

    const wonCount = await this.prisma.opportunity.count({
      where: { ...where, status: 'GAGNE' },
    });

    const lostCount = await this.prisma.opportunity.count({
      where: { ...where, status: 'PERDU' },
    });

    const conversionRate = wonCount + lostCount > 0
      ? (wonCount / (wonCount + lostCount)) * 100
      : 0;

    const countByStatus = await Promise.all(
      Object.keys(STATUS_PROBABILITY).map(async status => ({
        status,
        count: await this.prisma.opportunity.count({
          where: { ...where, status: status as any },
        }),
      })),
    );

    return {
      totalPipeline,
      weightedPipeline,
      wonCount,
      lostCount,
      conversionRate,
      countByStatus,
    };
  }

  async assignOpportunity(ctx: OpportunityContext, opportunityId: string, newOwnerId: string) {
    // Only Responsable filière or Admin can reassign
    if (ctx.role !== 'RESPONSABLE_FILIERE' && ctx.role !== 'ADMIN') {
      throw new ForbiddenException('Seul un responsable filière ou admin peut réassigner une opportunité');
    }

    // Get the opportunity
    const opportunity = await this.findOne(ctx, opportunityId);

    // If same owner, no change needed
    if (opportunity.ownerId === newOwnerId) {
      return opportunity;
    }

    // Verify the new owner exists and is a commercial in the same tenant
    const newOwner = await this.prisma.user.findFirst({
      where: {
        id: newOwnerId,
        tenantId: ctx.tenantId,
        role: 'COMMERCIAL',
      },
    });

    if (!newOwner) {
      throw new ForbiddenException('Commercial non trouvé ou non autorisé');
    }

    // Get previous owner info for event
    const previousOwner = await this.prisma.user.findUnique({
      where: { id: opportunity.ownerId },
      select: { firstName: true, lastName: true },
    });

    // Update the opportunity with new owner
    const updated = await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: {
        previousOwnerId: opportunity.ownerId,
        ownerChangedAt: new Date(),
        ownerId: newOwnerId,
      },
      include: {
        client: true,
        owner: true,
        lines: { orderBy: { createdAt: 'asc' } },
      },
    });

    // Create OWNER_CHANGE event
    await this.createEvent(opportunityId, OpportunityEventType.OWNER_CHANGE, ctx.userId,
      `Propriétaire: ${previousOwner?.firstName} ${previousOwner?.lastName} → ${newOwner.firstName} ${newOwner.lastName}`,
      { previousOwnerId: opportunity.ownerId, newOwnerId });

    return {
      ...updated,
      weightedAmount: updated.amount * (updated.probability / 100),
      lines: updated.lines.map((line: any) => ({
        ...line,
        total: line.quantity * line.unitPrice,
      })),
    };
  }

  async getCommercialsForAssignment(ctx: OpportunityContext) {
    // Get all commercials in the tenant
    const commercials = await this.prisma.user.findMany({
      where: {
        tenantId: ctx.tenantId,
        role: 'COMMERCIAL',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });

    return commercials;
  }

  async delete(ctx: OpportunityContext, id: string) {
    // Only Admin or Responsable filière can delete
    if (ctx.role !== 'ADMIN' && ctx.role !== 'RESPONSABLE_FILIERE') {
      throw new ForbiddenException('Seul un admin ou responsable filière peut supprimer une opportunité');
    }

    // Verify opportunity exists and is accessible
    const opportunity = await this.findOne(ctx, id);

    // Delete the opportunity (lines are deleted via cascade)
    await this.prisma.opportunity.delete({
      where: { id },
    });

    return opportunity;
  }

  // ============================================
  // OPPORTUNITY LINES MANAGEMENT
  // ============================================

  private async recalculateOpportunityAmount(opportunityId: string) {
    const opportunity = await this.prisma.$queryRaw<{manualAmount: number}[]>`
      SELECT manual_amount as "manualAmount" FROM opportunities WHERE id = ${opportunityId}
    `;

    const lines = await this.prisma.opportunityLine.findMany({
      where: { opportunityId },
    });

    const linesTotal = lines.reduce((sum, line) => sum + (line.quantity * line.unitPrice), 0);
    // Ensure manualAmount is a proper number (raw query may return Decimal)
    const manualAmount = Number(opportunity?.[0]?.manualAmount) || 0;
    const totalAmount = manualAmount + linesTotal;
    
    console.log('recalculateOpportunityAmount:', { opportunityId, manualAmount, linesTotal, totalAmount });

    await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: { amount: totalAmount },
    });

    return totalAmount;
  }

  async addProductLine(ctx: OpportunityContext, opportunityId: string, productId: string, quantity: number) {
    // Verify access to opportunity
    const opportunity = await this.findOne(ctx, opportunityId);

    // Get product details
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenantId: ctx.tenantId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    // Check if line already exists for this product
    const existingLine = await this.prisma.opportunityLine.findFirst({
      where: { opportunityId, productId },
    });

    let line;
    if (existingLine) {
      // Update quantity
      line = await this.prisma.opportunityLine.update({
        where: { id: existingLine.id },
        data: { quantity: existingLine.quantity + quantity },
      });
    } else {
      // Create new line
      line = await this.prisma.opportunityLine.create({
        data: {
          opportunityId,
          productId,
          productName: product.name,
          quantity,
          unitPrice: product.unitPrice,
        },
      });
    }

    // Recalculate opportunity amount
    await this.recalculateOpportunityAmount(opportunityId);

    return this.findOne(ctx, opportunityId);
  }

  async addKitLine(ctx: OpportunityContext, opportunityId: string, kitId: string, quantity: number) {
    // Verify access to opportunity
    const opportunity = await this.findOne(ctx, opportunityId);

    // Get kit details
    const kit = await this.prisma.productKit.findFirst({
      where: { id: kitId, tenantId: ctx.tenantId, isActive: true },
    });

    if (!kit) {
      throw new NotFoundException('Kit non trouvé');
    }

    // Check if line already exists for this kit
    const existingLine = await this.prisma.opportunityLine.findFirst({
      where: { opportunityId, kitId },
    });

    let line;
    if (existingLine) {
      // Update quantity
      line = await this.prisma.opportunityLine.update({
        where: { id: existingLine.id },
        data: { quantity: existingLine.quantity + quantity },
      });
    } else {
      // Create new line
      line = await this.prisma.opportunityLine.create({
        data: {
          opportunityId,
          kitId,
          productName: `Kit: ${kit.name}`,
          quantity,
          unitPrice: kit.price,
        },
      });
    }

    // Recalculate opportunity amount
    await this.recalculateOpportunityAmount(opportunityId);

    return this.findOne(ctx, opportunityId);
  }

  async updateLine(ctx: OpportunityContext, lineId: string, quantity: number) {
    // Get the line
    const line = await this.prisma.opportunityLine.findUnique({
      where: { id: lineId },
      include: { opportunity: true },
    });

    if (!line) {
      throw new NotFoundException('Ligne non trouvée');
    }

    // Verify access to opportunity
    await this.findOne(ctx, line.opportunityId);

    if (quantity <= 0) {
      // Delete the line if quantity is 0 or negative
      await this.prisma.opportunityLine.delete({
        where: { id: lineId },
      });
    } else {
      // Update quantity
      await this.prisma.opportunityLine.update({
        where: { id: lineId },
        data: { quantity },
      });
    }

    // Recalculate opportunity amount
    await this.recalculateOpportunityAmount(line.opportunityId);

    return this.findOne(ctx, line.opportunityId);
  }

  async removeLine(ctx: OpportunityContext, lineId: string) {
    // Get the line
    const line = await this.prisma.opportunityLine.findUnique({
      where: { id: lineId },
    });

    if (!line) {
      throw new NotFoundException('Ligne non trouvée');
    }

    // Verify access to opportunity
    await this.findOne(ctx, line.opportunityId);

    // Delete the line
    await this.prisma.opportunityLine.delete({
      where: { id: lineId },
    });

    // Recalculate opportunity amount
    await this.recalculateOpportunityAmount(line.opportunityId);

    return this.findOne(ctx, line.opportunityId);
  }

  async convertToOrder(ctx: OpportunityContext, opportunityId: string) {
    // Get opportunity with lines
    const opportunity = await this.findOne(ctx, opportunityId);

    // Verify opportunity is GAGNE
    if (opportunity.status !== 'GAGNE') {
      throw new BadRequestException('Seules les opportunités gagnées peuvent être converties en commande');
    }

    // Verify opportunity has at least one line
    if (!opportunity.lines || opportunity.lines.length === 0) {
      throw new BadRequestException('L\'opportunité doit contenir au moins un produit pour être convertie');
    }

    // Check if already converted
    const existingOrder = await this.prisma.order.findFirst({
      where: { opportunityId },
    });

    if (existingOrder) {
      throw new BadRequestException('Cette opportunité a déjà été convertie en commande');
    }

    // Prepare lines for order
    const orderLines = opportunity.lines.map(line => ({
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      productId: line.productId || undefined,
      kitId: line.kitId || undefined,
    }));

    // Create order from opportunity (include manualAmount)
    const manualAmount = Number(opportunity.manualAmount) || 0;
    const order = await this.ordersService.createFromOpportunity(
      { userId: ctx.userId, tenantId: ctx.tenantId, role: ctx.role },
      opportunityId,
      orderLines,
      opportunity.clientId,
      manualAmount,
    );

    // Update opportunity status to CONVERTI
    await this.prisma.opportunity.update({
      where: { id: opportunityId },
      data: { status: 'CONVERTI' },
    });

    return order;
  }

  // ============================================
  // TIMELINE & HISTORIQUE (Story 9.6)
  // ============================================

  async getTimeline(ctx: OpportunityContext, opportunityId: string) {
    // Verify access
    await this.findOne(ctx, opportunityId);

    const [events, notes] = await Promise.all([
      this.prisma.opportunityEvent.findMany({
        where: { opportunityId },
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.opportunityNote.findMany({
        where: { opportunityId },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      events: events.map(e => ({
        ...e,
        metadata: e.metadata ? JSON.stringify(e.metadata) : null,
      })),
      notes,
    };
  }

  async addNote(ctx: OpportunityContext, input: AddOpportunityNoteInput) {
    // Verify access
    await this.findOne(ctx, input.opportunityId);

    // Create note (no event needed, notes are displayed directly in timeline)
    const note = await this.prisma.opportunityNote.create({
      data: {
        content: input.content,
        opportunityId: input.opportunityId,
        authorId: ctx.userId,
      },
      include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });

    return note;
  }

  async createEvent(
    opportunityId: string,
    type: OpportunityEventType,
    userId: string | null,
    description?: string,
    metadata?: Record<string, any>,
  ) {
    return this.prisma.opportunityEvent.create({
      data: {
        opportunityId,
        type,
        userId,
        description,
        metadata: metadata || undefined,
      },
    });
  }

  async getEventsByType(ctx: OpportunityContext, opportunityId: string, types: OpportunityEventType[]) {
    await this.findOne(ctx, opportunityId);

    const events = await this.prisma.opportunityEvent.findMany({
      where: {
        opportunityId,
        type: { in: types },
      },
      include: { user: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return events.map(e => ({
      ...e,
      metadata: e.metadata ? JSON.stringify(e.metadata) : null,
    }));
  }
}
