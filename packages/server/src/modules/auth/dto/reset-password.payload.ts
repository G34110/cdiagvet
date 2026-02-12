import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ResetPasswordPayload {
  @Field()
  success: boolean;

  @Field()
  message: string;
}

@ObjectType()
export class ValidateTokenPayload {
  @Field()
  valid: boolean;

  @Field({ nullable: true })
  email?: string;
}
