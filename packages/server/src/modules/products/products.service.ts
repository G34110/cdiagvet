import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  CreateProductInput,
  UpdateProductInput,
  CreateProductKitInput,
  UpdateProductKitInput,
} from './dto/create-product.input';

interface ProductContext {
  tenantId: string;
  userId: string;
  role: string;
}

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ==================== PRODUCTS ====================

  async findAllProducts(ctx: ProductContext, includeInactive = false) {
    const where: any = { tenantId: ctx.tenantId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.product.findMany({
      where,
      include: { filiere: true },
      orderBy: [{ name: 'asc' }],
    });
  }

  async findProductById(ctx: ProductContext, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: { filiere: true },
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    return product;
  }

  async findProductsByFiliere(ctx: ProductContext, filiereId: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId: ctx.tenantId,
        filiereId,
        isActive: true,
      },
      include: { filiere: true },
      orderBy: [{ name: 'asc' }],
    });
  }

  async createProduct(ctx: ProductContext, input: CreateProductInput) {
    if (ctx.role !== 'ADMIN') {
      throw new ForbiddenException('Seul un admin peut créer un produit');
    }

    return this.prisma.product.create({
      data: {
        ...input,
        tenantId: ctx.tenantId,
      },
      include: { filiere: true },
    });
  }

  async updateProduct(ctx: ProductContext, id: string, input: UpdateProductInput) {
    if (ctx.role !== 'ADMIN') {
      throw new ForbiddenException('Seul un admin peut modifier un produit');
    }

    await this.findProductById(ctx, id);

    return this.prisma.product.update({
      where: { id },
      data: input,
      include: { filiere: true },
    });
  }

  async deleteProduct(ctx: ProductContext, id: string) {
    if (ctx.role !== 'ADMIN') {
      throw new ForbiddenException('Seul un admin peut supprimer un produit');
    }

    const product = await this.findProductById(ctx, id);

    await this.prisma.product.delete({ where: { id } });

    return product;
  }

  // ==================== PRODUCT KITS ====================

  async findAllKits(ctx: ProductContext, includeInactive = false) {
    const where: any = { tenantId: ctx.tenantId };
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.productKit.findMany({
      where,
      include: {
        items: {
          include: {
            product: { include: { filiere: true } },
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });
  }

  async findKitById(ctx: ProductContext, id: string) {
    const kit = await this.prisma.productKit.findFirst({
      where: { id, tenantId: ctx.tenantId },
      include: {
        items: {
          include: {
            product: { include: { filiere: true } },
          },
        },
      },
    });

    if (!kit) {
      throw new NotFoundException('Kit non trouvé');
    }

    return kit;
  }

  async createKit(ctx: ProductContext, input: CreateProductKitInput) {
    if (ctx.role !== 'ADMIN') {
      throw new ForbiddenException('Seul un admin peut créer un kit');
    }

    const { items, ...kitData } = input;

    return this.prisma.productKit.create({
      data: {
        ...kitData,
        tenantId: ctx.tenantId,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: { include: { filiere: true } },
          },
        },
      },
    });
  }

  async updateKit(ctx: ProductContext, id: string, input: UpdateProductKitInput) {
    if (ctx.role !== 'ADMIN') {
      throw new ForbiddenException('Seul un admin peut modifier un kit');
    }

    await this.findKitById(ctx, id);

    const { items, ...kitData } = input;

    // If items are provided, replace all existing items
    if (items) {
      await this.prisma.productKitItem.deleteMany({ where: { kitId: id } });
    }

    return this.prisma.productKit.update({
      where: { id },
      data: {
        ...kitData,
        ...(items && {
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        }),
      },
      include: {
        items: {
          include: {
            product: { include: { filiere: true } },
          },
        },
      },
    });
  }

  async deleteKit(ctx: ProductContext, id: string) {
    if (ctx.role !== 'ADMIN') {
      throw new ForbiddenException('Seul un admin peut supprimer un kit');
    }

    const kit = await this.findKitById(ctx, id);

    await this.prisma.productKit.delete({ where: { id } });

    return kit;
  }
}
