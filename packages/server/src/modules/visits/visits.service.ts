import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateVisitInput } from './dto/create-visit.input';
import { UpdateVisitInput } from './dto/update-visit.input';
import { VisitsFilterInput } from './dto/visits-filter.input';

@Injectable()
export class VisitsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateVisitInput, userId: string) {
    // Validate date is not in the past
    const visitDate = new Date(input.date);
    if (visitDate < new Date()) {
      throw new BadRequestException('La date et l\'heure ne peuvent pas être antérieures à maintenant.');
    }

    const data: any = {
      date: new Date(input.date),
      subject: input.subject,
      notes: input.notes,
      userId,
    };

    // Only set clientId if provided (visite client)
    if (input.clientId) {
      data.clientId = input.clientId;
    }

    return this.prisma.visit.create({
      data,
      include: { client: true, user: true },
    });
  }

  async findById(id: string, userId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id },
      include: { 
        client: true, 
        user: true,
        photos: true,
      },
    });

    if (!visit) {
      throw new NotFoundException(`Visit ${id} not found`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return visit;
  }

  async findByUser(userId: string, filter?: VisitsFilterInput) {
    const where: any = { userId };

    if (filter?.clientId) {
      where.clientId = filter.clientId;
    }

    if (filter?.startDate || filter?.endDate) {
      where.date = {};
      if (filter.startDate) {
        where.date.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.date.lte = new Date(filter.endDate);
      }
    }

    return this.prisma.visit.findMany({
      where,
      include: { client: true, user: true },
      orderBy: { date: 'asc' },
      skip: filter?.skip ?? 0,
      take: filter?.take ?? 100,
    });
  }

  async findByUserRole(
    ctx: { tenantId: string; userId: string; role: string; filiereIds?: string[] },
    filter?: VisitsFilterInput,
  ) {
    const where: any = {};

    // Role-based filtering
    if (ctx.role === 'COMMERCIAL') {
      // COMMERCIAL sees all their own visits (with or without client)
      where.userId = ctx.userId;
    } else if (ctx.role === 'RESPONSABLE_FILIERE') {
      // RESPONSABLE sees ONLY client visits from their filières (not personal RDV)
      if (ctx.filiereIds?.length) {
        where.clientId = { not: null }; // Only visits with a client
        where.client = {
          tenantId: ctx.tenantId,
          deletedAt: null,
          filieres: { some: { filiereId: { in: ctx.filiereIds } } },
        };
      } else {
        return []; // No filières assigned
      }
    } else if (ctx.role === 'ADMIN') {
      // ADMIN sees only client visits (not personal RDV)
      where.clientId = { not: null };
      where.client = { tenantId: ctx.tenantId, deletedAt: null };
    }

    if (filter?.clientId) {
      where.clientId = filter.clientId;
    }

    if (filter?.startDate || filter?.endDate) {
      where.date = {};
      if (filter.startDate) {
        where.date.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.date.lte = new Date(filter.endDate);
      }
    }

    return this.prisma.visit.findMany({
      where,
      include: { client: true, user: true },
      orderBy: { date: 'asc' },
      skip: filter?.skip ?? 0,
      take: filter?.take ?? 100,
    });
  }

  async findByClient(clientId: string, userId: string) {
    return this.prisma.visit.findMany({
      where: { clientId, userId },
      include: { user: true },
      orderBy: { date: 'desc' },
    });
  }

  async findUpcoming(userId: string, days: number = 7) {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.prisma.visit.findMany({
      where: {
        userId,
        date: {
          gte: now,
          lte: endDate,
        },
      },
      include: { client: true },
      orderBy: { date: 'asc' },
    });
  }

  async findToday(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.visit.findMany({
      where: {
        userId,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: { client: true },
      orderBy: { date: 'asc' },
    });
  }

  async update(id: string, userId: string, data: UpdateVisitInput) {
    const visit = await this.prisma.visit.findUnique({ where: { id } });

    if (!visit) {
      throw new NotFoundException(`Visit ${id} not found`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    return this.prisma.visit.update({
      where: { id },
      data: updateData,
      include: { client: true, user: true },
    });
  }

  async delete(id: string, userId: string) {
    const visit = await this.prisma.visit.findUnique({ where: { id } });

    if (!visit) {
      throw new NotFoundException(`Visit ${id} not found`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.visit.delete({
      where: { id },
    });
  }
}
