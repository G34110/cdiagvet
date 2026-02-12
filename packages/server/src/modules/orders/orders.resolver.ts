import { Resolver, Query, Mutation, Args, ResolveField, Parent, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { Order, OrderLine, OrderStatus } from './entities/order.entity';
import { CreateOrderInput, CreateOrderLineInput } from './dto/create-order.input';
import { UpdateOrderInput, UpdateOrderStatusInput } from './dto/update-order.input';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Resolver(() => Order)
@UseGuards(JwtAuthGuard)
export class OrdersResolver {
  constructor(private readonly ordersService: OrdersService) {}

  @Query(() => [Order], { name: 'orders' })
  findAll(@CurrentUser() user: any) {
    return this.ordersService.findAll({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      clientId: user.clientId,
    });
  }

  @Query(() => [Order], { name: 'ordersByStatus' })
  findByStatus(
    @CurrentUser() user: any,
    @Args('status', { type: () => OrderStatus }) status: OrderStatus,
  ) {
    return this.ordersService.findByStatus(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      status,
    );
  }

  @Query(() => Order, { name: 'order' })
  findOne(@CurrentUser() user: any, @Args('id') id: string) {
    return this.ordersService.findOne(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      id,
    );
  }

  @Query(() => [Order], { name: 'ordersByClient' })
  findByClient(
    @CurrentUser() user: any,
    @Args('clientId') clientId: string,
  ) {
    return this.ordersService.findByClient(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      clientId,
    );
  }

  @Mutation(() => Order)
  createOrder(@CurrentUser() user: any, @Args('input') input: CreateOrderInput) {
    return this.ordersService.create(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      input,
    );
  }

  @Mutation(() => Order)
  updateOrder(@CurrentUser() user: any, @Args('input') input: UpdateOrderInput) {
    return this.ordersService.update(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      input,
    );
  }

  @Mutation(() => Order)
  updateOrderStatus(@CurrentUser() user: any, @Args('input') input: UpdateOrderStatusInput) {
    return this.ordersService.updateStatus(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      input,
    );
  }

  @Mutation(() => Order)
  validateOrder(@CurrentUser() user: any, @Args('id') id: string) {
    return this.ordersService.validate(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      id,
    );
  }

  @Mutation(() => Order)
  cancelOrder(@CurrentUser() user: any, @Args('id') id: string) {
    return this.ordersService.cancel(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      id,
    );
  }

  @Mutation(() => Boolean)
  deleteOrder(@CurrentUser() user: any, @Args('id') id: string) {
    return this.ordersService.delete(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      id,
    );
  }

  @Mutation(() => Order)
  addOrderLine(
    @CurrentUser() user: any,
    @Args('orderId') orderId: string,
    @Args('line') line: CreateOrderLineInput,
  ) {
    return this.ordersService.addLine(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      orderId,
      line,
    );
  }

  @Mutation(() => Order)
  updateOrderLine(
    @CurrentUser() user: any,
    @Args('lineId') lineId: string,
    @Args('quantity') quantity: number,
  ) {
    return this.ordersService.updateLine(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      lineId,
      quantity,
    );
  }

  @Mutation(() => Order)
  removeOrderLine(@CurrentUser() user: any, @Args('lineId') lineId: string) {
    return this.ordersService.removeLine(
      { userId: user.id, tenantId: user.tenantId, role: user.role },
      lineId,
    );
  }

  @ResolveField(() => Float)
  total(@Parent() order: Order): number {
    return order.lines?.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0) || 0;
  }
}

@Resolver(() => OrderLine)
export class OrderLineResolver {
  @ResolveField(() => Float)
  total(@Parent() line: OrderLine): number {
    return line.quantity * line.unitPrice;
  }
}
