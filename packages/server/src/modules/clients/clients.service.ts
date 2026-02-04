import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClientInput } from './dto/create-client.input';

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
    });
  }

  async findById(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
      include: { filiere: true, commercial: true, notes: true },
    });
  }

  async findByCommercial(commercialId: string) {
    return this.prisma.client.findMany({
      where: { commercialId, isActive: true, deletedAt: null },
      include: { filiere: true },
    });
  }

  async findByFiliere(filiereId: string) {
    return this.prisma.client.findMany({
      where: { filiereId, isActive: true, deletedAt: null },
      include: { commercial: true },
    });
  }

  async findByTenant(tenantId: string) {
    return this.prisma.client.findMany({
      where: { tenantId, isActive: true, deletedAt: null },
      include: { filiere: true, commercial: true },
    });
  }

  async update(id: string, data: Partial<CreateClientInput>) {
    return this.prisma.client.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string) {
    return this.prisma.client.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
