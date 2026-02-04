import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateNoteInput } from './dto/create-note.input';
import { UpdateNoteInput } from './dto/update-note.input';

@Injectable()
export class NotesService {
  constructor(private prisma: PrismaService) {}

  async create(input: CreateNoteInput, authorId: string) {
    return this.prisma.note.create({
      data: {
        content: input.content,
        clientId: input.clientId,
        authorId,
      },
      include: { author: true },
    });
  }

  async findByClient(clientId: string) {
    return this.prisma.note.findMany({
      where: { clientId },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const note = await this.prisma.note.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!note) {
      throw new NotFoundException(`Note ${id} not found`);
    }

    return note;
  }

  async update(id: string, authorId: string, data: UpdateNoteInput) {
    const note = await this.prisma.note.findUnique({ where: { id } });

    if (!note) {
      throw new NotFoundException(`Note ${id} not found`);
    }

    if (note.authorId !== authorId) {
      throw new ForbiddenException('Only the author can edit this note');
    }

    return this.prisma.note.update({
      where: { id },
      data,
      include: { author: true },
    });
  }

  async delete(id: string, authorId: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });

    if (!note) {
      throw new NotFoundException(`Note ${id} not found`);
    }

    if (note.authorId !== authorId) {
      throw new ForbiddenException('Only the author can delete this note');
    }

    return this.prisma.note.delete({ where: { id } });
  }
}
