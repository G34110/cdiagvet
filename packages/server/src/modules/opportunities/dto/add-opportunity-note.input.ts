import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID, IsString, MinLength } from 'class-validator';

@InputType()
export class AddOpportunityNoteInput {
  @Field(() => ID)
  @IsUUID()
  opportunityId: string;

  @Field()
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  content: string;
}
