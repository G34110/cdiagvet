import { InputType, Field } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class ChangePasswordInput {
  @Field()
  @IsString()
  @MinLength(8)
  newPassword: string;

  @Field()
  @IsString()
  @MinLength(8)
  confirmPassword: string;
}
