import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClientInput } from './dto/create-client.input';
import { UpdateClientInput } from './dto/update-client.input';
import { ClientsFilterInput } from './dto/clients-filter.input';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateClientInput, tenantId: string, commercialId: string) {
    return this.prisma.client.create({
      data: {
        ...input,
        tenantId,
        commercialId,
      },
      include: { filiere: true, commercial: true },
    });
  }

  async findById(id: string, tenantId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { 
        filiere: true, 
        commercial: true, 
        notes: { orderBy: { createdAt: 'desc' } },
        visits: { orderBy: { date: 'desc' }, take: 10 },
      },
    });

    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    if (client.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return client;
  }

  async findAll(tenantId: string, filter?: ClientsFilterInput) {
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { city: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter?.filiereId) {
      where.filiereId = filter.filiereId;
    }

    if (filter?.city) {
      where.city = { contains: filter.city, mode: 'insensitive' };
    }

    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    const [clients, total] = await Promise.all([
      this.prisma.client.findMany({
        where,
        include: { filiere: true, commercial: true },
        orderBy: { name: 'asc' },
        skip: filter?.skip ?? 0,
        take: filter?.take ?? 50,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { clients, total };
  }

  async findByCommercial(commercialId: string, filter?: ClientsFilterInput) {
    const where: any = {
      commercialId,
      deletedAt: null,
    };

    // Filter by active status if specified
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { city: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      include: { filiere: true },
      orderBy: { name: 'asc' },
      skip: filter?.skip ?? 0,
      take: filter?.take ?? 50,
    });
  }

  async findForMap(tenantId: string) {
    return this.prisma.client.findMany({
      where: {
        tenantId,
        deletedAt: null,
        isActive: true,
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        filiere: { select: { id: true, name: true } },
      },
    });
  }

  async update(id: string, tenantId: string, data: UpdateClientInput) {
    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    if (client.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.client.update({
      where: { id },
      data,
      include: { filiere: true, commercial: true },
    });
  }

  async softDelete(id: string, tenantId: string) {
    const client = await this.prisma.client.findUnique({ where: { id } });

    if (!client) {
      throw new NotFoundException(`Client ${id} not found`);
    }

    if (client.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async getStats(tenantId: string) {
    const [total, active, byFiliere] = await Promise.all([
      this.prisma.client.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.client.count({ where: { tenantId, deletedAt: null, isActive: true } }),
      this.prisma.client.groupBy({
        by: ['filiereId'],
        where: { tenantId, deletedAt: null },
        _count: true,
      }),
    ]);

    return { total, active, inactive: total - active, byFiliere };
  }
}
