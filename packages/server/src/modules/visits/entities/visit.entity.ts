import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Client } from '../../clients/entities/client.entity';

@ObjectType()
export class VisitUser {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;
}

@ObjectType()
export class Visit {
  @Field(() => ID)
  id: string;

  @Field()
  date: Date;

  @Field({ nullable: true })
  subject?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  clientId?: string;

  @Field(() => Client, { nullable: true })
  client?: Client;

  @Field()
  userId: string;

  @Field(() => VisitUser, { nullable: true })
  user?: VisitUser;
}
