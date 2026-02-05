import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class DashboardStats {
  @Field(() => Int)
  totalClients: number;

  @Field(() => Int)
  activeClients: number;

  @Field(() => Int)
  totalVisits: number;

  @Field(() => Int)
  visitsThisMonth: number;

  @Field(() => Int)
  totalLots: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Float)
  revenueThisMonth: number;
}

@ObjectType()
export class ClientAlert {
  @Field()
  clientId: string;

  @Field()
  clientName: string;

  @Field()
  alertType: string;

  @Field()
  message: string;

  @Field(() => Date)
  createdAt: Date;
}

@ObjectType()
export class RevenueByMonth {
  @Field()
  month: string;

  @Field(() => Float)
  revenue: number;
}

@ObjectType()
export class DashboardData {
  @Field(() => DashboardStats)
  stats: DashboardStats;

  @Field(() => [ClientAlert])
  alerts: ClientAlert[];

  @Field(() => [RevenueByMonth])
  revenueByMonth: RevenueByMonth[];
}
