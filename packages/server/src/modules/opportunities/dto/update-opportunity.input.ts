import { InputType, Field, Float, Int, PartialType } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { CreateOpportunityInput } from './create-opportunity.input';

@InputType()
export class UpdateOpportunityInput extends PartialType(CreateOpportunityInput) {
  @Field()
  @IsString()
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  status?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lostReason?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  lostComment?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
