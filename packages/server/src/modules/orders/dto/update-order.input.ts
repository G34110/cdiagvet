import { InputType, Field, Float } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID, IsEnum, IsNumber, Min } from 'class-validator';
import { OrderStatus } from '../entities/order.entity';

@InputType()
export class UpdateOrderInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @Field(() => OrderStatus, { nullable: true })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @Field({ nullable: true })
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  expectedDelivery?: Date;

  @Field({ nullable: true })
  @IsOptional()
  trackingNumber?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;
}

@InputType()
export class ValidateOrderInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  id: string;
}

@InputType()
export class UpdateOrderStatusInput {
  @Field()
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @Field(() => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @Field({ nullable: true })
  @IsOptional()
  trackingNumber?: string;
}
