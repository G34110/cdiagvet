import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePhotoInput } from './dto/create-photo.input';

@Injectable()
export class PhotosService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreatePhotoInput, userId: string) {
    const visit = await this.prisma.visit.findUnique({
      where: { id: input.visitId },
    });

    if (!visit) {
      throw new NotFoundException(`Visit ${input.visitId} not found`);
    }

    if (visit.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.photo.create({
      data: {
        url: input.url,
        caption: input.caption,
        visitId: input.visitId,
      },
    });
  }

  async findByVisit(visitId: string) {
    return this.prisma.photo.findMany({
      where: { visitId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.photo.findMany({
      where: {
        visit: { clientId },
      },
      include: { visit: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string, userId: string) {
    const photo = await this.prisma.photo.findUnique({
      where: { id },
      include: { visit: true },
    });

    if (!photo) {
      throw new NotFoundException(`Photo ${id} not found`);
    }

    if (photo.visit.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.photo.delete({ where: { id } });
  }
}
