import { gql } from '@apollo/client';

export const OPPORTUNITIES_QUERY = gql`
  query Opportunities {
    opportunities {
      id
      title
      contactName
      contactEmail
      contactPhone
      source
      amount
      probability
      expectedCloseDate
      status
      notes
      createdAt
      updatedAt
      weightedAmount
      client {
        id
        name
        organization
      }
      owner {
        id
        firstName
        lastName
        email
      }
      lines {
        id
        productName
        quantity
        unitPrice
        total
      }
    }
  }
`;

export const OPPORTUNITIES_BY_STATUS_QUERY = gql`
  query OpportunitiesByStatus($status: String!) {
    opportunitiesByStatus(status: $status) {
      id
      title
      contactName
      source
      amount
      probability
      expectedCloseDate
      status
      weightedAmount
      client {
        id
        name
      }
      owner {
        id
        firstName
        lastName
      }
    }
  }
`;

export const OPPORTUNITY_QUERY = gql`
  query Opportunity($id: String!) {
    opportunity(id: $id) {
      id
      title
      contactName
      contactEmail
      contactPhone
      source
      amount
      probability
      expectedCloseDate
      status
      lostReason
      lostComment
      notes
      createdAt
      updatedAt
      weightedAmount
      client {
        id
        name
        organization
      }
      owner {
        id
        firstName
        lastName
        email
      }
      lines {
        id
        productName
        quantity
        unitPrice
        total
      }
    }
  }
`;

export const CREATE_OPPORTUNITY_MUTATION = gql`
  mutation CreateOpportunity($input: CreateOpportunityInput!) {
    createOpportunity(input: $input) {
      id
      title
      status
      amount
      client {
        id
        name
      }
    }
  }
`;

export const UPDATE_OPPORTUNITY_MUTATION = gql`
  mutation UpdateOpportunity($input: UpdateOpportunityInput!) {
    updateOpportunity(input: $input) {
      id
      title
      status
      amount
      probability
      expectedCloseDate
      notes
    }
  }
`;

export const UPDATE_OPPORTUNITY_STATUS_MUTATION = gql`
  mutation UpdateOpportunityStatus(
    $id: String!
    $status: String!
    $lostReason: String
    $lostComment: String
  ) {
    updateOpportunityStatus(
      id: $id
      status: $status
      lostReason: $lostReason
      lostComment: $lostComment
    ) {
      id
      status
      lostReason
      lostComment
    }
  }
`;

export const ASSIGN_OPPORTUNITY_MUTATION = gql`
  mutation AssignOpportunity($opportunityId: String!, $newOwnerId: String!) {
    assignOpportunity(opportunityId: $opportunityId, newOwnerId: $newOwnerId) {
      id
      owner {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

export const COMMERCIALS_FOR_ASSIGNMENT_QUERY = gql`
  query CommercialsForAssignment {
    commercialsForAssignment {
      id
      firstName
      lastName
      email
    }
  }
`;

export const DELETE_OPPORTUNITY_MUTATION = gql`
  mutation DeleteOpportunity($id: String!) {
    deleteOpportunity(id: $id) {
      id
    }
  }
`;
