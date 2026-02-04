import { Resolver, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FilieresService } from './filieres.service';
import { Filiere } from './entities/filiere.entity';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => Filiere)
@UseGuards(GqlAuthGuard)
export class FilieresResolver {
  constructor(private readonly filieresService: FilieresService) {}

  @Query(() => [Filiere])
  async filieres(@CurrentUser() user: { tenantId: string }) {
    return this.filieresService.findAll(user.tenantId);
  }
}
