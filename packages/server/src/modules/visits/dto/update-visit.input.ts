import { InputType, Field, PartialType } from '@nestjs/graphql';
import { IsOptional, IsDateString } from 'class-validator';
import { CreateVisitInput } from './create-visit.input';

@InputType()
export class UpdateVisitInput extends PartialType(CreateVisitInput) {
  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  date?: string;
}
