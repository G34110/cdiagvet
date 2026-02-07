import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';

@InputType()
export class CreateProductInput {
  @Field()
  @IsNotEmpty()
  code: string;

  @Field({ nullable: true })
  @IsOptional()
  gtin?: string;

  @Field()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @Field({ nullable: true })
  @IsOptional()
  filiereId?: string;
}

@InputType()
export class UpdateProductInput {
  @Field({ nullable: true })
  @IsOptional()
  code?: string;

  @Field({ nullable: true })
  @IsOptional()
  gtin?: string;

  @Field({ nullable: true })
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  filiereId?: string;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;
}

@InputType()
export class KitItemInput {
  @Field()
  @IsNotEmpty()
  productId: string;

  @Field({ defaultValue: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

@InputType()
export class CreateProductKitInput {
  @Field()
  @IsNotEmpty()
  code: string;

  @Field()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  price: number;

  @Field(() => [KitItemInput])
  items: KitItemInput[];
}

@InputType()
export class UpdateProductKitInput {
  @Field({ nullable: true })
  @IsOptional()
  code?: string;

  @Field({ nullable: true })
  @IsOptional()
  name?: string;

  @Field({ nullable: true })
  @IsOptional()
  description?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;

  @Field(() => [KitItemInput], { nullable: true })
  @IsOptional()
  items?: KitItemInput[];
}
