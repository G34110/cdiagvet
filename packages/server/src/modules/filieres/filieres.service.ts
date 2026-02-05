import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class FilieresService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.filiere.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findByUserRole(tenantId: string, role: string, filiereIds?: string[]) {
    // RESPONSABLE_FILIERE: only their assigned filières
    if (role === 'RESPONSABLE_FILIERE' && filiereIds?.length) {
      return this.prisma.filiere.findMany({
        where: { tenantId, id: { in: filiereIds } },
        orderBy: { name: 'asc' },
      });
    }
    // ADMIN, COMMERCIAL: all filières
    return this.findAll(tenantId);
  }

  async findById(id: string) {
    return this.prisma.filiere.findUnique({
      where: { id },
    });
  }
}
