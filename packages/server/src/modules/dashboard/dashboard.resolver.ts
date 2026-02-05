import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import { DashboardData } from './entities/dashboard.entity';

interface CurrentUserPayload {
  id: string;
  tenantId: string;
  role: string;
  filiereIds?: string[];
}

@Resolver()
@UseGuards(GqlAuthGuard)
export class DashboardResolver {
  constructor(private readonly dashboardService: DashboardService) {}

  @Query(() => DashboardData)
  async dashboardData(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<DashboardData> {
    return this.dashboardService.getDashboardData({
      tenantId: user.tenantId,
      userId: user.id,
      role: user.role,
      filiereIds: user.filiereIds,
    });
  }
}
