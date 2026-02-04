import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID } from 'class-validator';

@InputType()
export class CreateNoteInput {
  @Field()
  @IsNotEmpty()
  content: string;

  @Field()
  @IsNotEmpty()
  @IsUUID()
  clientId: string;
}
