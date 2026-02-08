import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID, IsInt, Min, IsNumber } from 'class-validator';

@InputType()
export class CreateOrderLineInput {
  @Field()
  @IsNotEmpty()
  productName: string;

  @Field({ nullable: true })
  @IsOptional()
  productCode?: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  quantity: number;

  @Field(() => Float)
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  kitId?: string;
}

@InputType()
export class CreateOrderInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  clientId: string;

  @Field({ nullable: true })
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  expectedDelivery?: Date;

  @Field(() => [CreateOrderLineInput], { nullable: true })
  @IsOptional()
  lines?: CreateOrderLineInput[];
}
