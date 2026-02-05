import { ObjectType, Field, ID, Float } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Filiere } from '../../filieres/entities/filiere.entity';

@ObjectType()
export class Client {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  organization?: string;

  @Field({ nullable: true })
  addressLine1?: string;

  @Field({ nullable: true })
  addressLine2?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  region?: string;

  @Field({ nullable: true })
  postalCode?: string;

  @Field({ defaultValue: 'FR' })
  country: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  email?: string;

  @Field(() => Float, { nullable: true })
  latitude?: number;

  @Field(() => Float, { nullable: true })
  longitude?: number;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [Filiere], { nullable: true })
  filieres?: Filiere[];

  @Field(() => User, { nullable: true })
  commercial?: User;

  @Field({ nullable: true })
  commercialId?: string;
}
