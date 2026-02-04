import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Client } from './entities/client.entity';
import { CreateClientInput } from './dto/create-client.input';

@Resolver(() => Client)
export class ClientsResolver {
  constructor(private clientsService: ClientsService) {}

  @Mutation(() => Client)
  @UseGuards(GqlAuthGuard)
  async createClient(
    @Args('input') input: CreateClientInput,
    @CurrentUser() user: { id: string; tenantId: string },
  ) {
    return this.clientsService.create(input, user.tenantId, user.id);
  }

  @Query(() => [Client])
  @UseGuards(GqlAuthGuard)
  async myClients(@CurrentUser() user: { id: string }) {
    return this.clientsService.findByCommercial(user.id);
  }

  @Query(() => Client, { nullable: true })
  @UseGuards(GqlAuthGuard)
  async client(@Args('id') id: string) {
    return this.clientsService.findById(id);
  }
}
