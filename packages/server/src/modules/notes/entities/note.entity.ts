import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class NoteAuthor {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;
}

@ObjectType()
export class Note {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  clientId: string;

  @Field()
  authorId: string;

  @Field(() => NoteAuthor, { nullable: true })
  author?: NoteAuthor;
}
