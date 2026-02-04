import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional } from 'class-validator';

@InputType()
export class UpdateNoteInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsNotEmpty()
  content?: string;
}
