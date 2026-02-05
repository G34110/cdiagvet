import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeocodingService } from '../../common/services/geocoding.service';
import { CreateClientInput } from './dto/create-client.input';
import { UpdateClientInput } from './dto/update-client.input';
import { ClientsFilterInput } from './dto/clients-filter.input';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
  ) {}

  async create(input: CreateClientInput, tenantId: string, commercialId: string) {
    this.logger.log(`Creating client: ${input.name}, address: ${input.address}, city: ${input.city}`);
    
    const coords = await this.geocoding.geocodeAddress(
      input.address,
      input.city,
      input.postalCode,
      'France',
    );

    this.logger.log(`Geocoding result: ${JSON.stringify(coords)}`);

    const { filiereIds, ...clientData } = input;

    const client = await this.prisma.client.create({
      data: {
        ...clientData,
        tenantId,
        commercialId,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        filieres: filiereIds?.length ? {
          create: filiereIds.map(filiereId => ({ filiereId })),
        } : undefined,
      },
      include: { 
        filieres: { include: { filiere: true } }, 
        commercial: true,
      },
    });

    return this.transformClientFilieres(client);
  }

  private transformClientFilieres(client: any) {
    return {
      ...client,
      filieres: client.filieres?.map((cf: any) => cf.filiere) || [],
    };
  }

  async findById(id: string, tenantId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { 
        filieres: { include: { filiere: true } }, 
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

    return this.transformClientFilieres(client);
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

    if (filter?.filiereIds?.length) {
      where.filieres = { some: { filiereId: { in: filter.filiereIds } } };
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
        include: { filieres: { include: { filiere: true } }, commercial: true },
        orderBy: { name: 'asc' },
        skip: filter?.skip ?? 0,
        take: filter?.take ?? 50,
      }),
      this.prisma.client.count({ where }),
    ]);

    return { clients: clients.map((c: any) => this.transformClientFilieres(c)), total };
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

    // Filter by filières
    if (filter?.filiereIds && filter.filiereIds.length > 0) {
      where.filieres = {
        some: {
          filiereId: { in: filter.filiereIds },
        },
      };
    }

    const clients = await this.prisma.client.findMany({
      where,
      include: { filieres: { include: { filiere: true } } },
      orderBy: { name: 'asc' },
      skip: filter?.skip ?? 0,
      take: filter?.take ?? 50,
    });
    return clients.map((c: any) => this.transformClientFilieres(c));
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
        filieres: { include: { filiere: { select: { id: true, name: true } } } },
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

    const { filiereIds, ...rest } = data;
    const updateData: any = { ...rest };

    // Re-geocode if address changed
    const addressChanged =
      (data.address !== undefined && data.address !== client.address) ||
      (data.city !== undefined && data.city !== client.city) ||
      (data.postalCode !== undefined && data.postalCode !== client.postalCode);

    if (addressChanged) {
      const coords = await this.geocoding.geocodeAddress(
        data.address ?? client.address ?? undefined,
        data.city ?? client.city ?? undefined,
        data.postalCode ?? client.postalCode ?? undefined,
        'France',
      );
      if (coords) {
        updateData.latitude = coords.latitude;
        updateData.longitude = coords.longitude;
      }
    }

    // Update filieres if provided
    if (filiereIds !== undefined) {
      updateData.filieres = {
        deleteMany: {},
        create: filiereIds.map(filiereId => ({ filiereId })),
      };
    }

    const updated = await this.prisma.client.update({
      where: { id },
      data: updateData,
      include: { filieres: { include: { filiere: true } }, commercial: true },
    });

    return this.transformClientFilieres(updated);
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
    const [total, active] = await Promise.all([
      this.prisma.client.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.client.count({ where: { tenantId, deletedAt: null, isActive: true } }),
    ]);

    // Get stats by filière via the join table
    const byFiliere = await this.prisma.clientFiliere.groupBy({
      by: ['filiereId'],
      where: { client: { tenantId, deletedAt: null } },
      _count: true,
    });

    return { total, active, inactive: total - active, byFiliere };
  }

  async getFiliereIdsByNames(names: string[], tenantId: string): Promise<string[]> {
    const filieres = await this.prisma.filiere.findMany({
      where: {
        tenantId,
        name: { in: names, mode: 'insensitive' },
      },
      select: { id: true },
    });
    return filieres.map((f: { id: string }) => f.id);
  }
}
