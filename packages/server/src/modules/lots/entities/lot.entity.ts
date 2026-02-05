import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class Product {
  @Field(() => ID)
  id: string;

  @Field()
  gtin: string;

  @Field()
  name: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class Lot {
  @Field(() => ID)
  id: string;

  @Field()
  lotNumber: string;

  @Field(() => Date, { nullable: true })
  expirationDate?: Date | null;

  @Field(() => String, { nullable: true })
  rawBarcode?: string | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Product)
  product: Product;
}

@ObjectType()
export class LotClient {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Date)
  deliveryDate: Date;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Lot)
  lot: Lot;

  @Field(() => String)
  clientId: string;

  @Field(() => String, { nullable: true })
  clientName?: string | null;

  @Field(() => String, { nullable: true })
  clientAddress?: string | null;

  @Field(() => String, { nullable: true })
  clientCity?: string | null;

  @Field(() => String, { nullable: true })
  clientPostalCode?: string | null;
}

@ObjectType()
export class LotTraceability {
  @Field(() => Lot)
  lot: Lot;

  @Field(() => [LotClient])
  deliveries: LotClient[];

  @Field(() => Int)
  totalQuantity: number;

  @Field(() => Int)
  clientCount: number;
}

@ObjectType()
export class ScanResult {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => String, { nullable: true })
  message?: string;

  @Field(() => Lot, { nullable: true })
  lot?: Lot | null;

  @Field(() => String, { nullable: true })
  gtin?: string;

  @Field(() => String, { nullable: true })
  lotNumber?: string;

  @Field(() => Date, { nullable: true })
  expirationDate?: Date | null;

  @Field(() => String, { nullable: true })
  productName?: string | null;

  @Field(() => Boolean)
  isNewProduct: boolean;
}
