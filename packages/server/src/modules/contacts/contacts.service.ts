import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContactInput } from './dto/create-contact.input';
import { UpdateContactInput } from './dto/update-contact.input';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateContactInput, userId: string) {
    // Vérifier que l'utilisateur a accès au client
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { client: true },
    });

    if (!user) {
      throw new ForbiddenException('Utilisateur non trouvé');
    }

    // Pour un distributeur, vérifier qu'il crée un contact pour son propre client
    if (user.role === 'DISTRIBUTEUR' && user.clientId !== input.clientId) {
      throw new ForbiddenException('Vous ne pouvez créer des contacts que pour votre propre entreprise');
    }

    // Si isPrimary est true, mettre tous les autres contacts à false
    if (input.isPrimary) {
      await this.prisma.contact.updateMany({
        where: { clientId: input.clientId },
        data: { isPrimary: false },
      });
    }

    return this.prisma.contact.create({
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        isPrimary: input.isPrimary ?? false,
        clientId: input.clientId,
      },
    });
  }

  async update(id: string, userId: string, input: UpdateContactInput) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException('Contact non trouvé');
    }

    // Vérifier les droits d'accès
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('Utilisateur non trouvé');
    }

    if (user.role === 'DISTRIBUTEUR' && user.clientId !== contact.clientId) {
      throw new ForbiddenException('Vous ne pouvez modifier que les contacts de votre propre entreprise');
    }

    // Si isPrimary est true, mettre tous les autres contacts à false
    if (input.isPrimary) {
      await this.prisma.contact.updateMany({
        where: { clientId: contact.clientId, id: { not: id } },
        data: { isPrimary: false },
      });
    }

    return this.prisma.contact.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string, userId: string) {
    const contact = await this.prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      throw new NotFoundException('Contact non trouvé');
    }

    // Vérifier les droits d'accès
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ForbiddenException('Utilisateur non trouvé');
    }

    if (user.role === 'DISTRIBUTEUR' && user.clientId !== contact.clientId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que les contacts de votre propre entreprise');
    }

    return this.prisma.contact.delete({
      where: { id },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.contact.findMany({
      where: { clientId },
      orderBy: [{ isPrimary: 'desc' }, { lastName: 'asc' }],
    });
  }

  async findById(id: string) {
    return this.prisma.contact.findUnique({
      where: { id },
    });
  }

  async findMyContacts(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.clientId) {
      return [];
    }

    return this.prisma.contact.findMany({
      where: { clientId: user.clientId },
      orderBy: [{ isPrimary: 'desc' }, { lastName: 'asc' }],
    });
  }
}
