import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsInt, IsDate, Min } from 'class-validator';

@InputType()
export class ScanBarcodeInput {
  @Field(() => String)
  @IsString()
  barcode: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  productName?: string;
}

@InputType()
export class AssociateLotClientInput {
  @Field(() => String)
  @IsString()
  lotId: string;

  @Field(() => String)
  @IsString()
  clientId: string;

  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number;

  @Field(() => Date, { nullable: true })
  @IsDate()
  @IsOptional()
  deliveryDate?: Date;
}
