import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class UserPayload {
  @Field()
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  role: string;

  @Field({ nullable: true })
  clientId?: string;

  @Field()
  mustChangePassword: boolean;
}

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field(() => UserPayload)
  user: UserPayload;
}
