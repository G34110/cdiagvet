import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Client } from './entities/client.entity';
import { CreateClientInput } from './dto/create-client.input';
import { UpdateClientInput } from './dto/update-client.input';
import { ClientsFilterInput } from './dto/clients-filter.input';
import { ClientsResponse, ClientStats, ClientMapItem } from './dto/clients-response';

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

  @Mutation(() => Client)
  @UseGuards(GqlAuthGuard)
  async updateClient(
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdateClientInput,
    @CurrentUser() user: { tenantId: string },
  ) {
    return this.clientsService.update(id, user.tenantId, input);
  }

  @Mutation(() => Client)
  @UseGuards(GqlAuthGuard)
  async deleteClient(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: { tenantId: string },
  ) {
    return this.clientsService.softDelete(id, user.tenantId);
  }

  @Query(() => ClientsResponse)
  @UseGuards(GqlAuthGuard)
  async clients(
    @Args('filter', { nullable: true }) filter: ClientsFilterInput,
    @CurrentUser() user: { tenantId: string },
  ) {
    return this.clientsService.findAll(user.tenantId, filter);
  }

  @Query(() => [Client])
  @UseGuards(GqlAuthGuard)
  async myClients(
    @Args('filter', { nullable: true }) filter: ClientsFilterInput,
    @CurrentUser() user: { id: string },
  ) {
    return this.clientsService.findByCommercial(user.id, filter);
  }

  @Query(() => Client)
  @UseGuards(GqlAuthGuard)
  async client(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: { tenantId: string },
  ) {
    return this.clientsService.findById(id, user.tenantId);
  }

  @Query(() => [ClientMapItem])
  @UseGuards(GqlAuthGuard)
  async clientsForMap(@CurrentUser() user: { tenantId: string }) {
    return this.clientsService.findForMap(user.tenantId);
  }

  @Query(() => ClientStats)
  @UseGuards(GqlAuthGuard)
  async clientStats(@CurrentUser() user: { tenantId: string }) {
    return this.clientsService.getStats(user.tenantId);
  }
}
