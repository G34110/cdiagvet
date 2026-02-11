import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { OpportunitiesService } from './opportunities.service';
import { 
  Opportunity, 
  CommercialUser, 
  OpportunityTimeline, 
  OpportunityNote,
  OpportunityEvent,
  OpportunityEventType,
} from './entities/opportunity.entity';
import { CreateOpportunityInput } from './dto/create-opportunity.input';
import { UpdateOpportunityInput } from './dto/update-opportunity.input';
import { AddOpportunityNoteInput } from './dto/add-opportunity-note.input';
import { Order } from '../orders/entities/order.entity';

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

  @Mutation(() => Opportunity)
  async assignOpportunity(
    @CurrentUser() user: CurrentUserPayload,
    @Args('opportunityId') opportunityId: string,
    @Args('newOwnerId') newOwnerId: string,
  ) {
    return this.opportunitiesService.assignOpportunity(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      opportunityId,
      newOwnerId,
    );
  }

  @Query(() => [CommercialUser], { name: 'commercialsForAssignment' })
  async getCommercialsForAssignment(@CurrentUser() user: CurrentUserPayload) {
    return this.opportunitiesService.getCommercialsForAssignment({
      tenantId: user.tenantId,
      userId: user.id,
      role: user.role,
      filiereIds: user.filiereIds,
    });
  }

  @Mutation(() => Opportunity)
  async deleteOpportunity(
    @CurrentUser() user: CurrentUserPayload,
    @Args('id') id: string,
  ) {
    return this.opportunitiesService.delete(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      id,
    );
  }

  // ============================================
  // OPPORTUNITY LINES MUTATIONS
  // ============================================

  @Mutation(() => Opportunity)
  async addProductToOpportunity(
    @CurrentUser() user: CurrentUserPayload,
    @Args('opportunityId') opportunityId: string,
    @Args('productId') productId: string,
    @Args('quantity', { type: () => Int, defaultValue: 1 }) quantity: number,
  ) {
    return this.opportunitiesService.addProductLine(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      opportunityId,
      productId,
      quantity,
    );
  }

  @Mutation(() => Opportunity)
  async addKitToOpportunity(
    @CurrentUser() user: CurrentUserPayload,
    @Args('opportunityId') opportunityId: string,
    @Args('kitId') kitId: string,
    @Args('quantity', { type: () => Int, defaultValue: 1 }) quantity: number,
  ) {
    return this.opportunitiesService.addKitLine(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      opportunityId,
      kitId,
      quantity,
    );
  }

  @Mutation(() => Opportunity)
  async updateOpportunityLine(
    @CurrentUser() user: CurrentUserPayload,
    @Args('lineId') lineId: string,
    @Args('quantity', { type: () => Int }) quantity: number,
  ) {
    return this.opportunitiesService.updateLine(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      lineId,
      quantity,
    );
  }

  @Mutation(() => Opportunity)
  async removeOpportunityLine(
    @CurrentUser() user: CurrentUserPayload,
    @Args('lineId') lineId: string,
  ) {
    return this.opportunitiesService.removeLine(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      lineId,
    );
  }

  @Mutation(() => Order, { description: 'Convertit une opportunité gagnée en commande' })
  async convertOpportunityToOrder(
    @CurrentUser() user: CurrentUserPayload,
    @Args('opportunityId') opportunityId: string,
  ) {
    return this.opportunitiesService.convertToOrder(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      opportunityId,
    );
  }

  // ============================================
  // TIMELINE & HISTORIQUE (Story 9.6)
  // ============================================

  @Query(() => OpportunityTimeline, { name: 'opportunityTimeline' })
  async getTimeline(
    @CurrentUser() user: CurrentUserPayload,
    @Args('opportunityId') opportunityId: string,
  ) {
    return this.opportunitiesService.getTimeline(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      opportunityId,
    );
  }

  @Query(() => [OpportunityEvent], { name: 'opportunityEvents' })
  async getEvents(
    @CurrentUser() user: CurrentUserPayload,
    @Args('opportunityId') opportunityId: string,
    @Args('types', { type: () => [OpportunityEventType], nullable: true }) types?: OpportunityEventType[],
  ) {
    if (types && types.length > 0) {
      return this.opportunitiesService.getEventsByType(
        {
          tenantId: user.tenantId,
          userId: user.id,
          role: user.role,
          filiereIds: user.filiereIds,
        },
        opportunityId,
        types,
      );
    }
    const timeline = await this.opportunitiesService.getTimeline(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      opportunityId,
    );
    return timeline.events;
  }

  @Mutation(() => OpportunityNote, { description: 'Ajoute une note à l\'opportunité' })
  async addOpportunityNote(
    @CurrentUser() user: CurrentUserPayload,
    @Args('input') input: AddOpportunityNoteInput,
  ) {
    return this.opportunitiesService.addNote(
      {
        tenantId: user.tenantId,
        userId: user.id,
        role: user.role,
        filiereIds: user.filiereIds,
      },
      input,
    );
  }
}
