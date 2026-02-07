import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProductsService } from './products.service';
import { Product, ProductKit } from './entities/product.entity';
import {
  CreateProductInput,
  UpdateProductInput,
  CreateProductKitInput,
  UpdateProductKitInput,
} from './dto/create-product.input';

interface CurrentUserPayload {
  id: string;
  email: string;
  tenantId: string;
  role: string;
}

@Resolver()
@UseGuards(JwtAuthGuard)
export class ProductsResolver {
  constructor(private readonly productsService: ProductsService) {}

  // ==================== PRODUCTS ====================

  @Query(() => [Product], { name: 'products' })
  async getProducts(
    @CurrentUser() user: CurrentUserPayload,
    @Args('includeInactive', { nullable: true, defaultValue: false }) includeInactive: boolean,
  ) {
    return this.productsService.findAllProducts(
      { tenantId: user.tenantId, userId: user.id, role: user.role },
      includeInactive,
    );
  }

  @Query(() => Product, { name: 'product' })
  async getProduct(
    @CurrentUser() user: CurrentUserPayload,
    @Args('id') id: string,
  ) {
    return this.productsService.findProductById(
      { tenantId: user.tenantId, userId: user.id, role: user.role },
      id,
    );
  }

  @Query(() => [Product], { name: 'productsByFiliere' })
  async getProductsByFiliere(
    @CurrentUser() user: CurrentUserPayload,
    @Args('filiereId') filiereId: string,
  ) {
    return this.productsService.findProductsByFiliere(
      { tenantId: user.tenantId, userId: user.id, role: user.role },
      filiereId,
    );
  }

  @Mutation(() => Product)
  async createProduct(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input') input: CreateProductInput,
  ) {
    return this.productsService.createProduct(
      { tenantId: user.tenantId, userId: user.id, role: user.role },
      input,
    );
  }

  @Mutation(() => Product)
  async updateProduct(
    @CurrentUser() user: CurrentUserPayload,
    @Args('id') id: string,
    @Args('input') input: UpdateProductInput,
  ) {
    return this.productsService.updateProduct(
      { tenantId: user.tenantId, userId: user.id, role: user.role },
      id,
      input,
    );
  }

  @Mutation(() => Product)
  async deleteProduct(
    @CurrentUser() user: CurrentUserPayload,
    @Args('id') id: string,
  ) {
    return this.productsService.deleteProduct(
      { tenantId: user.tenantId, userId: user.id, role: user.role },
      id,
    );
  }

  // ==================== PRODUCT KITS ====================

  @Query(() => [ProductKit], { name: 'productKits' })
  async getProductKits(
    @CurrentUser() user: CurrentUserPayload,
    @Args('includeInactive', { nullable: true, defaultValue: false }) includeInactive: boolean,
  ) {
    return this.productsService.findAllKits(
      { tenantId: user.tenantId, userId: user.id, role: user.role },
      includeInactive,
    );
  }

  @Query(() => ProductKit, { name: 'productKit' })
  async getProductKit(
    @CurrentUser() user: CurrentUserPayload,
    @Args('id') id: string,
  ) {
    return this.productsService.findKitById(
      { tenantId: user.tenantId, userId: user.id, role: user.role },
      id,
    );
  }

  @Mutation(() => ProductKit)
  async createProductKit(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input') input: CreateProductKitInput,
  ) {
    return this.productsService.createKit(
      { tenantId: user.tenantId, userId: user.id, role: user.role },
      input,
    );
  }

  @Mutation(() => ProductKit)
  async updateProductKit(
    @CurrentUser() user: CurrentUserPayload,
    @Args('id') id: string,
    @Args('input') input: UpdateProductKitInput,
  ) {
    return this.productsService.updateKit(
      { tenantId: user.tenantId, userId: user.id, role: user.role },
      id,
      input,
    );
  }

  @Mutation(() => ProductKit)
  async deleteProductKit(
    @CurrentUser() user: CurrentUserPayload,
    @Args('id') id: string,
  ) {
    return this.productsService.deleteKit(
      { tenantId: user.tenantId, userId: user.id, role: user.role },
      id,
    );
  }
}
