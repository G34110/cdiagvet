import { InputType, Field, Float, Int } from '@nestjs/graphql';
import { IsString, IsEmail, IsOptional, IsNumber, IsDateString, IsEnum, Min, Max } from 'class-validator';

export enum OpportunitySourceInput {
  SALON = 'SALON',
  APPEL_ENTRANT = 'APPEL_ENTRANT',
  RECOMMANDATION = 'RECOMMANDATION',
  SITE_WEB = 'SITE_WEB',
  AUTRE = 'AUTRE',
}

@InputType()
export class CreateOpportunityInput {
  @Field()
  @IsString()
  clientId: string;

  @Field()
  @IsString()
  title: string;

  @Field()
  @IsString()
  contactName: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @Field()
  @IsString()
  source: string;

  @Field(() => Float, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @Field(() => Float, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  manualAmount?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  probability?: number;

  @Field()
  @IsDateString()
  expectedCloseDate: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  ownerId?: string;
}
