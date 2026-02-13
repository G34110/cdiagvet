import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ClientSegmentation } from '../entities/client.entity';

@InputType()
export class CreateClientInput {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  organization?: string;

  @Field({ nullable: true })
  @IsOptional()
  addressLine1?: string;

  @Field({ nullable: true })
  @IsOptional()
  addressLine2?: string;

  @Field({ nullable: true })
  @IsOptional()
  city?: string;

  @Field({ nullable: true })
  @IsOptional()
  region?: string;

  @Field({ nullable: true })
  @IsOptional()
  postalCode?: string;

  @Field({ nullable: true, defaultValue: 'FR' })
  @IsOptional()
  country?: string;

  @Field({ nullable: true })
  @IsOptional()
  phone?: string;

  @Field()
  @IsNotEmpty({ message: 'L\'email est obligatoire' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  filiereIds?: string[];

  @Field(() => ClientSegmentation, { nullable: true, defaultValue: 'AUTRES' })
  @IsOptional()
  segmentation?: ClientSegmentation;
}
