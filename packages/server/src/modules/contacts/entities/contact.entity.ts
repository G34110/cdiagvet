import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Contact {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  email?: string;

  @Field()
  isPrimary: boolean;

  @Field()
  clientId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
