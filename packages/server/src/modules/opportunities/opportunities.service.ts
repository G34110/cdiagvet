import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateOpportunityInput } from './dto/create-opportunity.input';
import { UpdateOpportunityInput } from './dto/update-opportunity.input';

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
  constructor(private prisma: PrismaService) {}

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
        lines: true,
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
        lines: true,
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
    const opportunity = await this.prisma.opportunity.findFirst({
      where: {
        id,
        ...this.buildWhereClause(ctx),
      },
      include: {
        client: true,
        owner: true,
        lines: true,
      },
    });

    if (!opportunity) {
      throw new NotFoundException('Opportunité non trouvée');
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

    const opportunity = await this.prisma.opportunity.create({
      data: {
        title: input.title,
        contactName: input.contactName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        source: input.source as any,
        amount: input.amount,
        probability,
        expectedCloseDate: new Date(input.expectedCloseDate),
        notes: input.notes,
        clientId: input.clientId,
        ownerId: ctx.userId,
        tenantId: ctx.tenantId,
      },
      include: {
        client: true,
        owner: true,
        lines: true,
      },
    });

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

    const opportunity = await this.prisma.opportunity.update({
      where: { id: input.id },
      data: updateData,
      include: {
        client: true,
        owner: true,
        lines: true,
      },
    });

    return {
      ...opportunity,
      weightedAmount: opportunity.amount * (opportunity.probability / 100),
      lines: opportunity.lines.map(line => ({
        ...line,
        total: line.quantity * line.unitPrice,
      })),
    };
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
}
