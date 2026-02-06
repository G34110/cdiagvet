import { Module } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { OpportunitiesResolver } from './opportunities.resolver';

@Module({
  providers: [OpportunitiesService, OpportunitiesResolver],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
