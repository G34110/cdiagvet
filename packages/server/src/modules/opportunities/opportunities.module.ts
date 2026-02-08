import { Module, forwardRef } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { OpportunitiesResolver } from './opportunities.resolver';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [forwardRef(() => OrdersModule)],
  providers: [OpportunitiesService, OpportunitiesResolver],
  exports: [OpportunitiesService],
})
export class OpportunitiesModule {}
