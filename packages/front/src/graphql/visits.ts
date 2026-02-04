import { gql } from '@apollo/client';

export const MY_VISITS_QUERY = gql`
  query MyVisits($filter: VisitsFilterInput) {
    myVisits(filter: $filter) {
      id
      date
      subject
      notes
      clientId
      client {
        id
        name
        city
      }
    }
  }
`;

export const VISIT_QUERY = gql`
  query Visit($id: String!) {
    visit(id: $id) {
      id
      date
      subject
      notes
      clientId
      client {
        id
        name
        city
        phone
      }
      user {
        id
        firstName
        lastName
      }
      createdAt
      updatedAt
    }
  }
`;

export const CLIENT_VISITS_QUERY = gql`
  query ClientVisits($clientId: String!) {
    clientVisits(clientId: $clientId) {
      id
      date
      subject
      notes
      user {
        id
        firstName
        lastName
      }
    }
  }
`;

export const TODAY_VISITS_QUERY = gql`
  query TodayVisits {
    todayVisits {
      id
      date
      subject
      client {
        id
        name
        city
      }
    }
  }
`;

export const UPCOMING_VISITS_QUERY = gql`
  query UpcomingVisits($days: Int) {
    upcomingVisits(days: $days) {
      id
      date
      subject
      client {
        id
        name
        city
      }
    }
  }
`;

export const CREATE_VISIT_MUTATION = gql`
  mutation CreateVisit($input: CreateVisitInput!) {
    createVisit(input: $input) {
      id
      date
      subject
      clientId
    }
  }
`;

export const UPDATE_VISIT_MUTATION = gql`
  mutation UpdateVisit($id: String!, $input: UpdateVisitInput!) {
    updateVisit(id: $id, input: $input) {
      id
      date
      subject
      notes
    }
  }
`;

export const DELETE_VISIT_MUTATION = gql`
  mutation DeleteVisit($id: String!) {
    deleteVisit(id: $id) {
      id
    }
  }
`;
