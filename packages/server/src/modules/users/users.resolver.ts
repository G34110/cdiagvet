import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@Resolver(() => User)
export class UsersResolver {
  constructor(private usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: { id: string }) {
    return this.usersService.findById(user.id);
  }
}
