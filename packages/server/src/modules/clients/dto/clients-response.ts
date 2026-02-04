import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Client } from '../entities/client.entity';

@ObjectType()
export class ClientsResponse {
  @Field(() => [Client])
  clients: Client[];

  @Field(() => Int)
  total: number;
}

@ObjectType()
export class ClientStats {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  active: number;

  @Field(() => Int)
  inactive: number;
}

@ObjectType()
export class ClientMapItem {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field(() => Number)
  latitude: number;

  @Field(() => Number)
  longitude: number;
}
