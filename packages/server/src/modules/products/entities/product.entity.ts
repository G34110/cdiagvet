import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

@ObjectType()
export class ProductFiliere {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;
}

@ObjectType()
export class Product {
  @Field(() => ID)
  id: string;

  @Field()
  code: string;

  @Field({ nullable: true })
  gtin?: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  unitPrice: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  filiereId?: string;

  @Field(() => ProductFiliere, { nullable: true })
  filiere?: ProductFiliere;

  @Field()
  tenantId: string;
}

@ObjectType()
export class ProductKitItem {
  @Field(() => ID)
  id: string;

  @Field()
  quantity: number;

  @Field()
  productId: string;

  @Field(() => Product)
  product: Product;
}

@ObjectType()
export class ProductKit {
  @Field(() => ID)
  id: string;

  @Field()
  code: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  price: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  tenantId: string;

  @Field(() => [ProductKitItem])
  items: ProductKitItem[];
}
