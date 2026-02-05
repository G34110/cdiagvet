import { gql } from '@apollo/client';

export const DASHBOARD_DATA_QUERY = gql`
  query DashboardData {
    dashboardData {
      stats {
        totalClients
        activeClients
        totalVisits
        visitsThisMonth
        totalLots
        totalRevenue
        revenueThisMonth
      }
      alerts {
        clientId
        clientName
        alertType
        message
        createdAt
      }
      revenueByMonth {
        month
        revenue
      }
    }
  }
`;
