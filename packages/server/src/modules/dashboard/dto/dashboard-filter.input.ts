import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsString, IsDateString } from 'class-validator';

@InputType()
export class DashboardFilterInput {
  @Field({ nullable: true, description: 'Start date for the period filter' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @Field({ nullable: true, description: 'End date for the period filter' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @Field({ nullable: true, description: 'Preset period: M-1, Q-1, Y-1, or custom' })
  @IsOptional()
  @IsString()
  preset?: string;
}
