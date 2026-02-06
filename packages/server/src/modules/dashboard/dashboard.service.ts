import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DashboardData, DashboardStats, ClientAlert, RevenueByMonth } from './entities/dashboard.entity';

interface DashboardContext {
  tenantId: string;
  userId: string;
  role: string;
  filiereIds?: string[];
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(ctx: DashboardContext): Promise<DashboardData> {
    const stats = await this.getStats(ctx);
    const alerts = await this.getAlerts(ctx);
    const revenueByMonth = await this.getRevenueByMonth(ctx);

    return {
      stats,
      alerts,
      revenueByMonth,
    };
  }

  private buildClientFilter(ctx: DashboardContext): any {
    const filter: any = {
      tenantId: ctx.tenantId,
      deletedAt: null,
    };

    // COMMERCIAL: only their own clients
    if (ctx.role === 'COMMERCIAL') {
      filter.commercialId = ctx.userId;
    }
    // RESPONSABLE_FILIERE: clients of their filières
    else if (ctx.role === 'RESPONSABLE_FILIERE' && ctx.filiereIds?.length) {
      filter.filieres = {
        some: { filiereId: { in: ctx.filiereIds } },
      };
    }
    // ADMIN: all clients (no additional filter)

    return filter;
  }

  private async getStats(ctx: DashboardContext): Promise<DashboardStats> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const clientFilter = this.buildClientFilter(ctx);

    // Total clients
    const totalClients = await this.prisma.client.count({
      where: clientFilter,
    });

    // Active clients (isActive = true)
    const activeClients = await this.prisma.client.count({
      where: {
        ...clientFilter,
        isActive: true,
      },
    });

    // Total visits
    const visitsFilter: any = {
      client: clientFilter,
    };

    const totalVisits = await this.prisma.visit.count({
      where: visitsFilter,
    });

    // Visits this month (all visits in current month, not future months)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const visitsThisMonth = await this.prisma.visit.count({
      where: {
        ...visitsFilter,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // Total lots delivered
    const lotsFilter: any = {
      client: clientFilter,
    };

    const totalLots = await this.prisma.lotClient.count({
      where: lotsFilter,
    });

    // Revenue from orders
    const orders = await this.prisma.order.aggregate({
      where: {
        client: clientFilter,
        status: { not: 'CANCELLED' },
      },
      _sum: { total: true },
    });

    const ordersThisMonth = await this.prisma.order.aggregate({
      where: {
        client: clientFilter,
        status: { not: 'CANCELLED' },
        createdAt: { gte: startOfMonth },
      },
      _sum: { total: true },
    });

    return {
      totalClients,
      activeClients,
      totalVisits,
      visitsThisMonth,
      totalLots,
      totalRevenue: orders._sum.total || 0,
      revenueThisMonth: ordersThisMonth._sum.total || 0,
    };
  }

  private async getAlerts(ctx: DashboardContext): Promise<ClientAlert[]> {
    const alerts: ClientAlert[] = [];

    const clientFilter = {
      ...this.buildClientFilter(ctx),
      isActive: true,
    };

    // Find clients with:
    // - No visit in the last 30 days (J-30 to J)
    // - AND no scheduled visit in the next 60 days (J to J+60)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const clientsWithoutVisit = await this.prisma.client.findMany({
      where: {
        ...clientFilter,
        AND: [
          // No visit in the last 30 days
          {
            visits: {
              none: {
                date: { gte: thirtyDaysAgo, lte: now },
              },
            },
          },
          // No scheduled visit in the next 60 days
          {
            visits: {
              none: {
                date: { gt: now, lte: sixtyDaysFromNow },
              },
            },
          },
        ],
      },
      take: 10,
    });

    for (const client of clientsWithoutVisit) {
      alerts.push({
        clientId: client.id,
        clientName: client.name,
        alertType: 'NO_SCHEDULED_VISIT',
        message: 'Aucune visite depuis 30 jours et pas de visite prévue dans les 60 prochains jours',
        createdAt: new Date(),
      });
    }

    // Find lots expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringLots = await this.prisma.lotClient.findMany({
      where: {
        client: clientFilter,
        lot: {
          expirationDate: {
            lte: thirtyDaysFromNow,
            gte: new Date(),
          },
        },
      },
      include: {
        client: true,
        lot: { include: { product: true } },
      },
      take: 10,
    });

    for (const lotClient of expiringLots) {
      alerts.push({
        clientId: lotClient.clientId,
        clientName: lotClient.client.name,
        alertType: 'EXPIRING_LOT',
        message: `Lot ${lotClient.lot.lotNumber} expire bientôt (${lotClient.lot.product.name})`,
        createdAt: new Date(),
      });
    }

    return alerts.slice(0, 10);
  }

  private async getRevenueByMonth(ctx: DashboardContext): Promise<RevenueByMonth[]> {
    const months: RevenueByMonth[] = [];
    const now = new Date();
    const clientFilter = this.buildClientFilter(ctx);

    // Get last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const result = await this.prisma.order.aggregate({
        where: {
          client: clientFilter,
          status: { not: 'CANCELLED' },
          createdAt: {
            gte: date,
            lte: endDate,
          },
        },
        _sum: { total: true },
      });

      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months.push({
        month: monthName,
        revenue: result._sum.total || 0,
      });
    }

    return months;
  }
}
