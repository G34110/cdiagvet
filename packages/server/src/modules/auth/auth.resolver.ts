import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './dto/auth-payload';
import { RequestPasswordResetInput, ResetPasswordInput, ValidateResetTokenInput } from './dto/reset-password.input';
import { ResetPasswordPayload, ValidateTokenPayload } from './dto/reset-password.payload';
import { ChangePasswordInput } from './dto/change-password.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthPayload)
  async login(@Args('input') input: LoginInput): Promise<AuthPayload> {
    return this.authService.login(input.email, input.password);
  }

  @Mutation(() => ResetPasswordPayload)
  async requestPasswordReset(@Args('input') input: RequestPasswordResetInput): Promise<ResetPasswordPayload> {
    return this.authService.requestPasswordReset(input.email);
  }

  @Mutation(() => ValidateTokenPayload)
  async validateResetToken(@Args('input') input: ValidateResetTokenInput): Promise<ValidateTokenPayload> {
    return this.authService.validateResetToken(input.token);
  }

  @Mutation(() => ResetPasswordPayload)
  async resetPassword(@Args('input') input: ResetPasswordInput): Promise<ResetPasswordPayload> {
    if (input.newPassword !== input.confirmPassword) {
      return { success: false, message: 'Les mots de passe ne correspondent pas' };
    }
    if (input.newPassword.length < 6) {
      return { success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
    }
    return this.authService.resetPassword(input.token, input.newPassword);
  }

  @Mutation(() => ResetPasswordPayload)
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Args('input') input: ChangePasswordInput,
    @Context() context: any,
  ): Promise<ResetPasswordPayload> {
    console.log('[DEBUG] changePassword called with input:', input);
    console.log('[DEBUG] context.req.user:', context?.req?.user);
    
    try {
      if (input.newPassword !== input.confirmPassword) {
        return { success: false, message: 'Les mots de passe ne correspondent pas' };
      }
      if (input.newPassword.length < 8) {
        return { success: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
      }
      // Check entropy (simple check: must have uppercase, lowercase, number)
      const hasUpper = /[A-Z]/.test(input.newPassword);
      const hasLower = /[a-z]/.test(input.newPassword);
      const hasNumber = /[0-9]/.test(input.newPassword);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(input.newPassword);
      const entropy = (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);
      
      if (entropy < 3 || input.newPassword.length < 8) {
        return { success: false, message: 'Le mot de passe doit contenir au moins 8 caractères avec majuscules, minuscules et chiffres' };
      }
      
      const userId = context?.req?.user?.id;
      console.log('[DEBUG] userId:', userId);
      
      if (!userId) {
        return { success: false, message: 'Utilisateur non authentifié' };
      }
      
      return this.authService.changePassword(userId, input.newPassword);
    } catch (error) {
      console.error('[DEBUG] changePassword error:', error);
      throw error;
    }
  }
}
