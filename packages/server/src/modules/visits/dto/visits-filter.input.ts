import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class VisitsFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  clientId?: string;

  @Field({ nullable: true })
  @IsOptional()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  endDate?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  skip?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  take?: number;
}
