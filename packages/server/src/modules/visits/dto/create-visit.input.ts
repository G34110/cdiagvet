import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsDateString, IsUUID } from 'class-validator';

@InputType()
export class CreateVisitInput {
  @Field()
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @Field({ nullable: true })
  @IsOptional()
  subject?: string;

  @Field({ nullable: true })
  @IsOptional()
  notes?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID()
  clientId?: string;
}
