import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Photo {
  @Field(() => ID)
  id: string;

  @Field()
  url: string;

  @Field({ nullable: true })
  caption?: string;

  @Field()
  createdAt: Date;

  @Field()
  visitId: string;
}
