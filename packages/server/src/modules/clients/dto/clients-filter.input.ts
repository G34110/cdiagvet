import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, Min } from 'class-validator';

@InputType()
export class ClientsFilterInput {
  @Field({ nullable: true })
  @IsOptional()
  search?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  filiereIds?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  segmentations?: string[];

  @Field({ nullable: true })
  @IsOptional()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  isActive?: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @Min(0)
  skip?: number;

  @Field(() => Int, { nullable: true, defaultValue: 50 })
  @IsOptional()
  @Min(1)
  take?: number;
}
