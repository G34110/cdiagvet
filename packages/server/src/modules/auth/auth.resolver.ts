import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input.email, input.password);
  }
}
