import { gql } from '@apollo/client';

export const DASHBOARD_DATA_QUERY = gql`
  query DashboardData($filter: DashboardFilterInput) {
    dashboardData(filter: $filter) {
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
