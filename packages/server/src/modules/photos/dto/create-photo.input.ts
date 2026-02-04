import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID, IsUrl } from 'class-validator';

@InputType()
export class CreatePhotoInput {
  @Field()
  @IsNotEmpty()
  url: string;

  @Field({ nullable: true })
  @IsOptional()
  caption?: string;

  @Field()
  @IsNotEmpty()
  @IsUUID()
  visitId: string;
}
