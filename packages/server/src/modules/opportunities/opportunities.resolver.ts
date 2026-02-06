import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OpportunitiesService } from './opportunities.service';
import { Opportunity } from './entities/opportunity.entity';
import { CreateOpportunityInput } from './dto/create-opportunity.input';
import { UpdateOpportunityInput } from './dto/update-opportunity.input';

interface CurrentUserPayload {
  id: string;
  tenantId: string;
  role: string;
  filiereIds?: string[];
}

@Resolver(() => Opportunity)
@UseGuards(JwtAuthGuard)
export class OpportunitiesResolver {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Query(() => [Opportunity], { name: 'opportunities' })
  async findAll(@CurrentUser() user: CurrentUserPayload) {
    return this.opportunitiesService.findAll({
      tenantId: user.tenantId,
      userId: user.id,
      role: user.role,
      filiereIds: user.filiereIds,
    });
  }

  @Query(() => [Opportunity], { name: 'opportunitiesByStatus' })
  async findByStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Args('status') status: string,
  ) {
    return this.opportunitiesService.findByStatus(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      status,
    );
  }

  @Query(() => Opportunity, { name: 'opportunity' })
  async findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Args('id') id: string,
  ) {
    return this.opportunitiesService.findOne(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      id,
    );
  }

  @Mutation(() => Opportunity)
  async createOpportunity(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input') input: CreateOpportunityInput,
  ) {
    return this.opportunitiesService.create(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      input,
    );
  }

  @Mutation(() => Opportunity)
  async updateOpportunity(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input') input: UpdateOpportunityInput,
  ) {
    return this.opportunitiesService.update(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      input,
    );
  }

  @Mutation(() => Opportunity)
  async updateOpportunityStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Args('id') id: string,
    @Args('status') status: string,
    @Args('lostReason', { nullable: true }) lostReason?: string,
    @Args('lostComment', { nullable: true }) lostComment?: string,
  ) {
    return this.opportunitiesService.updateStatus(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      id,
      status,
      lostReason,
      lostComment,
    );
  }
}
