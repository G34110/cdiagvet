import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Filiere {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;
}
