import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { VisitsService } from './visits.service';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Visit } from './entities/visit.entity';
import { CreateVisitInput } from './dto/create-visit.input';
import { UpdateVisitInput } from './dto/update-visit.input';
import { VisitsFilterInput } from './dto/visits-filter.input';

@Resolver(() => Visit)
export class VisitsResolver {
  constructor(private visitsService: VisitsService) {}

  @Mutation(() => Visit)
  @UseGuards(GqlAuthGuard)
  async createVisit(
    @Args('input') input: CreateVisitInput,
    @CurrentUser() user: { id: string },
  ) {
    return this.visitsService.create(input, user.id);
  }

  @Mutation(() => Visit)
  @UseGuards(GqlAuthGuard)
  async updateVisit(
    @Args('id', { type: () => String }) id: string,
    @Args('input') input: UpdateVisitInput,
    @CurrentUser() user: { id: string },
  ) {
    return this.visitsService.update(id, user.id, input);
  }

  @Mutation(() => Visit)
  @UseGuards(GqlAuthGuard)
  async deleteVisit(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.visitsService.delete(id, user.id);
  }

  @Query(() => Visit)
  @UseGuards(GqlAuthGuard)
  async visit(
    @Args('id', { type: () => String }) id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.visitsService.findById(id, user.id);
  }

  @Query(() => [Visit])
  @UseGuards(GqlAuthGuard)
  async myVisits(
    @Args('filter', { nullable: true }) filter: VisitsFilterInput,
    @CurrentUser() user: { id: string },
  ) {
    return this.visitsService.findByUser(user.id, filter);
  }

  @Query(() => [Visit])
  @UseGuards(GqlAuthGuard)
  async clientVisits(
    @Args('clientId', { type: () => String }) clientId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.visitsService.findByClient(clientId, user.id);
  }

  @Query(() => [Visit])
  @UseGuards(GqlAuthGuard)
  async upcomingVisits(
    @Args('days', { type: () => Int, nullable: true, defaultValue: 7 }) days: number,
    @CurrentUser() user: { id: string },
  ) {
    return this.visitsService.findUpcoming(user.id, days);
  }

  @Query(() => [Visit])
  @UseGuards(GqlAuthGuard)
  async todayVisits(@CurrentUser() user: { id: string }) {
    return this.visitsService.findToday(user.id);
  }
}
