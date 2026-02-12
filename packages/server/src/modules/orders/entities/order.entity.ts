import { ObjectType, Field, Float, Int, registerEnumType } from '@nestjs/graphql';
import { Client } from '../../clients/entities/client.entity';
import { User } from '../../users/entities/user.entity';

export enum OrderStatus {
  BROUILLON = 'BROUILLON',
  VALIDEE = 'VALIDEE',
  PREPARATION = 'PREPARATION',
  EXPEDIEE = 'EXPEDIEE',
  LIVREE = 'LIVREE',
  ANNULEE = 'ANNULEE',
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
  description: 'Statut de la commande',
});

@ObjectType()
export class OrderLine {
  @Field()
  id: string;

  @Field()
  productName: string;

  @Field({ nullable: true })
  productCode?: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  total: number;

  @Field({ nullable: true })
  productId?: string;

  @Field({ nullable: true })
  kitId?: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class Order {
  @Field()
  id: string;

  @Field()
  reference: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => Float)
  totalHT: number;

  @Field(() => Float)
  totalTTC: number;

  @Field(() => Float)
  taxRate: number;

  @Field(() => Float)
  manualAmount: number;

  @Field({ nullable: true })
  expectedDelivery?: Date;

  @Field({ nullable: true })
  deliveredAt?: Date;

  @Field({ nullable: true })
  trackingNumber?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  validatedAt?: Date;

  @Field()
  clientId: string;

  @Field(() => Client)
  client: Client;

  @Field()
  ownerId: string;

  @Field(() => User)
  owner: User;

  @Field({ nullable: true })
  opportunityId?: string;

  @Field(() => [OrderLine])
  lines: OrderLine[];
}
