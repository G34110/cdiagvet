import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { GeocodingService } from '../../common/services/geocoding.service';
import { EmailService } from '../../common/services/email.service';
import { CreateClientInput } from './dto/create-client.input';
import { UpdateClientInput } from './dto/update-client.input';
import { ClientsFilterInput } from './dto/clients-filter.input';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    private prisma: PrismaService,
    private geocoding: GeocodingService,
    private emailService: EmailService,
  ) {}

  async create(input: CreateClientInput, tenantId: string, commercialId: string) {
    this.logger.log(`Creating client: ${input.name}, address: ${input.addressLine1}, city: ${input.city}`);
    
    const coords = await this.geocoding.geocodeAddress(
      input.addressLine1,
      input.city,
      input.postalCode,
      input.country || 'FR',
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

    // Auto-create portal account for DISTRIBUTEUR or AGENT clients
    if (input.segmentation === 'DISTRIBUTEUR' || input.segmentation === 'AGENT') {
      await this.createPortalAccount(client.id, input.email, input.name, tenantId);
    }

    return this.transformClientFilieres(client);
  }

  private async createPortalAccount(clientId: string, email: string, clientName: string, tenantId: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    
    if (existingUser) {
      this.logger.log(`Portal account already exists for ${email} - resetting password and sending credentials email`);
      // Reset password to client123 and set mustChangePassword
      const hashedPassword = await bcrypt.hash('client123', 10);
      await this.prisma.user.update({
        where: { email },
        data: { 
          passwordHash: hashedPassword,
          mustChangePassword: true,
        },
      });
      await this.emailService.sendPortalCredentials(email, clientName, 'client123');
      return;
    }

    const nameParts = clientName.split(' ');
    const firstName = nameParts[0] || 'Client';
    const lastName = nameParts.slice(1).join(' ') || 'Portail';

    // DEV/DEMO: Create account with password "client123" and require password change
    const hashedPassword = await bcrypt.hash('client123', 10);
    
    await this.prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        role: 'DISTRIBUTEUR',
        isActive: true,
        tenantId,
        clientId,
        mustChangePassword: true,
      },
    });
    
    this.logger.log(`Portal account created for ${email} (password=client123, must change on first login)`);
    
    // Send email with credentials
    await this.emailService.sendPortalCredentials(email, clientName, 'client123');
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

    if (filter?.segmentations?.length) {
      where.segmentation = { in: filter.segmentations };
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

    // Filter by segmentation
    if (filter?.segmentations?.length) {
      where.segmentation = { in: filter.segmentations };
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

  async findByUserRole(
    ctx: { tenantId: string; userId: string; email?: string; role: string; filiereIds?: string[] },
    filter?: ClientsFilterInput,
  ) {
    const where: any = {
      tenantId: ctx.tenantId,
      deletedAt: null,
    };

    // Role-based filtering
    if (ctx.role === 'COMMERCIAL') {
      where.commercialId = ctx.userId;
    } else if (ctx.role === 'RESPONSABLE_FILIERE') {
      if (ctx.filiereIds?.length) {
        where.filieres = { some: { filiereId: { in: ctx.filiereIds } } };
      } else {
        // RESPONSABLE without filières sees nothing (security)
        return [];
      }
    }
    // ADMIN sees all clients (no additional filter)

    // Apply additional filters
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }

    if (filter?.search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { name: { contains: filter.search, mode: 'insensitive' } },
          { city: { contains: filter.search, mode: 'insensitive' } },
          { phone: { contains: filter.search, mode: 'insensitive' } },
        ],
      });
    }

    // Filter by filières (for UI filter, combined with role filter)
    if (filter?.filiereIds && filter.filiereIds.length > 0) {
      if (ctx.role === 'RESPONSABLE_FILIERE' && ctx.filiereIds?.length) {
        // Responsable: client must have at least one of user's filières AND the filtered filière
        where.AND = where.AND || [];
        where.AND.push(
          { filieres: { some: { filiereId: { in: ctx.filiereIds } } } },
          { filieres: { some: { filiereId: { in: filter.filiereIds } } } },
        );
        // Remove the simple filieres filter set earlier
        delete where.filieres;
      } else {
        where.filieres = {
          some: { filiereId: { in: filter.filiereIds } },
        };
      }
    }

    // Filter by segmentation
    if (filter?.segmentations?.length) {
      where.segmentation = { in: filter.segmentations };
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
        addressLine1: true,
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
      (data.addressLine1 !== undefined && data.addressLine1 !== client.addressLine1) ||
      (data.city !== undefined && data.city !== client.city) ||
      (data.postalCode !== undefined && data.postalCode !== client.postalCode) ||
      (data.country !== undefined && data.country !== client.country);

    if (addressChanged) {
      const coords = await this.geocoding.geocodeAddress(
        data.addressLine1 ?? client.addressLine1 ?? undefined,
        data.city ?? client.city ?? undefined,
        data.postalCode ?? client.postalCode ?? undefined,
        data.country ?? client.country ?? 'FR',
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

    // Delete associated portal user account if exists
    await this.prisma.user.deleteMany({
      where: { clientId: id },
    });
    this.logger.log(`Deleted portal account(s) for client ${id}`);

    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async getStats(ctx: { tenantId: string; userId: string; role: string; filiereIds?: string[] }) {
    // Build filter based on user role
    const baseFilter: any = {
      tenantId: ctx.tenantId,
      deletedAt: null,
    };

    // COMMERCIAL: only their own clients
    if (ctx.role === 'COMMERCIAL') {
      baseFilter.commercialId = ctx.userId;
    }
    // RESPONSABLE_FILIERE: clients of their filières
    else if (ctx.role === 'RESPONSABLE_FILIERE' && ctx.filiereIds?.length) {
      baseFilter.filieres = {
        some: { filiereId: { in: ctx.filiereIds } },
      };
    }
    // ADMIN: all clients (no additional filter)

    const [total, active] = await Promise.all([
      this.prisma.client.count({ where: baseFilter }),
      this.prisma.client.count({ where: { ...baseFilter, isActive: true } }),
    ]);

    // Get stats by filière via the join table
    const filiereFilter: any = { client: baseFilter };
    // For RESPONSABLE_FILIERE, only show their filières stats
    if (ctx.role === 'RESPONSABLE_FILIERE' && ctx.filiereIds?.length) {
      filiereFilter.filiereId = { in: ctx.filiereIds };
    }

    const byFiliere = await this.prisma.clientFiliere.groupBy({
      by: ['filiereId'],
      where: filiereFilter,
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

  async deleteAll(tenantId: string): Promise<number> {
    // Delete in transaction with all dependent records
    const result = await this.prisma.$transaction(async (tx) => {
      // Get all client IDs for this tenant
      const clients = await tx.client.findMany({
        where: { tenantId },
        select: { id: true },
      });
      const clientIds = clients.map(c => c.id);
      
      if (clientIds.length === 0) return 0;

      // Delete dependent records first (cascade)
      // Delete order lines before orders
      await tx.orderLine.deleteMany({ where: { order: { clientId: { in: clientIds } } } });
      await tx.order.deleteMany({ where: { clientId: { in: clientIds } } });
      
      // Delete opportunity lines before opportunities
      await tx.opportunityLine.deleteMany({ where: { opportunity: { clientId: { in: clientIds } } } });
      await tx.opportunity.deleteMany({ where: { clientId: { in: clientIds } } });
      
      // Delete visits and related data
      await tx.photo.deleteMany({ where: { visit: { clientId: { in: clientIds } } } });
      await tx.visit.deleteMany({ where: { clientId: { in: clientIds } } });
      
      // Delete other dependent records
      await tx.lotClient.deleteMany({ where: { clientId: { in: clientIds } } });
      await tx.note.deleteMany({ where: { clientId: { in: clientIds } } });
      
      // Delete portal user accounts
      await tx.user.deleteMany({ where: { clientId: { in: clientIds } } });
      
      // Delete clients (ClientFiliere will cascade)
      const deleted = await tx.client.deleteMany({ where: { tenantId } });
      return deleted.count;
    });
    
    return result;
  }
}
