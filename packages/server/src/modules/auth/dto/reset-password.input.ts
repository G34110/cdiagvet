import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class RequestPasswordResetInput {
  @Field()
  email: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  token: string;

  @Field()
  newPassword: string;

  @Field()
  confirmPassword: string;
}

@InputType()
export class ValidateResetTokenInput {
  @Field()
  token: string;
}
