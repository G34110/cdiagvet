import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersResolver, OrderLineResolver } from './orders.resolver';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OrdersService, OrdersResolver, OrderLineResolver],
  exports: [OrdersService],
})
export class OrdersModule {}
