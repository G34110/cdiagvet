import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DashboardData, DashboardStats, ClientAlert, RevenueByMonth, RevenueDataPoint } from './entities/dashboard.entity';

interface PeriodFilter {
  startDate?: string;
  endDate?: string;
  preset?: string;
}

interface DashboardContext {
  tenantId: string;
  userId: string;
  role: string;
  filiereIds?: string[];
  filter?: PeriodFilter;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(ctx: DashboardContext): Promise<DashboardData> {
    const stats = await this.getStats(ctx);
    const alerts = await this.getAlerts(ctx);
    const revenueByMonth = await this.getRevenueByMonth(ctx);
    const revenueTrend = await this.getRevenueTrend(ctx);

    return {
      stats,
      alerts,
      revenueByMonth,
      revenueTrend,
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

  private resolvePeriod(filter?: PeriodFilter): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (filter?.startDate && filter?.endDate) {
      return { startDate: new Date(filter.startDate), endDate: new Date(filter.endDate) };
    }

    switch (filter?.preset) {
      case 'M-1': // Last month
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'Q-1': // Last quarter
        const currentQuarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        endDate = new Date(now.getFullYear(), currentQuarter * 3, 0, 23, 59, 59);
        break;
      case 'Y-1': // Last year
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
        break;
      case 'M': // Current month (default)
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
    }

    return { startDate, endDate };
  }

  private async getStats(ctx: DashboardContext): Promise<DashboardStats> {
    const { startDate, endDate } = this.resolvePeriod(ctx.filter);

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

    // Total visits (only visits with clients matching the filter)
    const visitsFilter: any = {
      clientId: { not: null },
      client: clientFilter,
    };

    const totalVisits = await this.prisma.visit.count({
      where: visitsFilter,
    });

    // Visits in selected period
    const visitsThisMonth = await this.prisma.visit.count({
      where: {
        ...visitsFilter,
        date: { gte: startDate, lte: endDate },
      },
    });

    // Total lots delivered
    const lotsFilter: any = {
      client: clientFilter,
    };

    // Count of delivered orders (status = LIVREE) for the period
    const deliveredOrders = await this.prisma.order.count({
      where: {
        client: clientFilter,
        status: 'LIVREE' as any,
        validatedAt: { gte: startDate, lte: endDate },
      },
    });

    // Revenue from validated orders only (VALIDEE, PREPARATION, EXPEDIEE, LIVREE)
    const orders = await this.prisma.order.aggregate({
      where: {
        client: clientFilter,
        status: { in: ['VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE'] as any },
      },
      _sum: { totalHT: true },
    });

    const ordersThisMonth = await this.prisma.order.aggregate({
      where: {
        client: clientFilter,
        status: { in: ['VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE'] as any },
        validatedAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalHT: true },
    });

    // Cancelled orders revenue for the period
    const cancelledOrders = await this.prisma.order.aggregate({
      where: {
        client: clientFilter,
        status: 'ANNULEE',
        updatedAt: { gte: startDate, lte: endDate },
      },
      _sum: { totalHT: true },
    });

    return {
      totalClients,
      activeClients,
      totalVisits,
      visitsThisMonth,
      totalLots: deliveredOrders,
      totalRevenue: orders._sum?.totalHT || 0,
      revenueThisMonth: ordersThisMonth._sum?.totalHT || 0,
      cancelledRevenue: cancelledOrders._sum?.totalHT || 0,
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
    const clientFilter = this.buildClientFilter(ctx);
    const { startDate, endDate } = this.resolvePeriod(ctx.filter);

    // Calculate number of months in the period
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
    const numMonths = Math.min(Math.max(monthsDiff, 1), 12); // Between 1 and 12 months

    // Get months in the selected period
    for (let i = numMonths - 1; i >= 0; i--) {
      const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const monthEndDate = new Date(endDate.getFullYear(), endDate.getMonth() - i + 1, 0);

      const result = await this.prisma.order.aggregate({
        where: {
          client: clientFilter,
          status: { in: ['VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE'] as any },
          validatedAt: {
            gte: date,
            lte: monthEndDate,
          },
        },
        _sum: { totalHT: true },
      });

      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      months.push({
        month: monthName,
        revenue: result._sum?.totalHT || 0,
      });
    }

    return months;
  }

  private async getRevenueTrend(ctx: DashboardContext): Promise<RevenueDataPoint[]> {
    const dataPoints: RevenueDataPoint[] = [];
    const clientFilter = this.buildClientFilter(ctx);
    const { startDate, endDate } = this.resolvePeriod(ctx.filter);
    const preset = ctx.filter?.preset || 'M';

    // For current month (M) or previous month (M-1): day-by-day data
    // For quarter (Q-1) or year (Y-1): month-by-month data
    const isDailyView = preset === 'M' || preset === 'M-1';

    if (isDailyView) {
      // Day-by-day for current month
      const daysInMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStart = new Date(startDate.getFullYear(), startDate.getMonth(), day, 0, 0, 0);
        const dayEnd = new Date(startDate.getFullYear(), startDate.getMonth(), day, 23, 59, 59);

        const result = await this.prisma.order.aggregate({
          where: {
            client: clientFilter,
            status: { in: ['VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE'] as any },
            validatedAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          _sum: { totalHT: true },
        });

        const cancelledResult = await this.prisma.order.aggregate({
          where: {
            client: clientFilter,
            status: 'ANNULEE',
            updatedAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
          _sum: { totalHT: true },
        });

        dataPoints.push({
          label: String(day),
          revenue: result._sum?.totalHT || 0,
          cancelledRevenue: cancelledResult._sum?.totalHT || 0,
        });
      }
    } else {
      // Month-by-month for quarter or year
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
      const numMonths = Math.min(Math.max(monthsDiff, 1), 12);

      for (let i = 0; i < numMonths; i++) {
        const monthStart = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const monthEnd = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0, 23, 59, 59);

        const result = await this.prisma.order.aggregate({
          where: {
            client: clientFilter,
            status: { in: ['VALIDEE', 'PREPARATION', 'EXPEDIEE', 'LIVREE'] as any },
            validatedAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: { totalHT: true },
        });

        const cancelledResult = await this.prisma.order.aggregate({
          where: {
            client: clientFilter,
            status: 'ANNULEE',
            updatedAt: {
              gte: monthStart,
              lte: monthEnd,
            },
          },
          _sum: { totalHT: true },
        });

        const monthAbbreviations = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
        dataPoints.push({
          label: monthAbbreviations[monthStart.getMonth()],
          revenue: result._sum?.totalHT || 0,
          cancelledRevenue: cancelledResult._sum?.totalHT || 0,
        });
      }
    }

    return dataPoints;
  }
}
