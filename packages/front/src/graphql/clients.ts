import { gql } from '@apollo/client';

export const CLIENTS_QUERY = gql`
  query Clients($filter: ClientsFilterInput) {
    clients(filter: $filter) {
      clients {
        id
        name
        organization
        addressLine1
        addressLine2
        city
        region
        postalCode
        country
        phone
        email
        isActive
        filieres {
          id
          name
        }
        commercial {
          id
          firstName
          lastName
        }
      }
      total
    }
  }
`;

export const MY_CLIENTS_QUERY = gql`
  query MyClients($filter: ClientsFilterInput) {
    myClients(filter: $filter) {
      id
      name
      organization
      addressLine1
      addressLine2
      city
      region
      postalCode
      country
      phone
      email
      isActive
      segmentation
      filieres {
        id
        name
      }
    }
  }
`;

export const CLIENT_QUERY = gql`
  query Client($id: String!) {
    client(id: $id) {
      id
      name
      organization
      addressLine1
      addressLine2
      city
      region
      postalCode
      country
      phone
      email
      latitude
      longitude
      isActive
      segmentation
      createdAt
      updatedAt
      filieres {
        id
        name
      }
      commercial {
        id
        firstName
        lastName
      }
    }
  }
`;

export const CLIENT_STATS_QUERY = gql`
  query ClientStats {
    clientStats {
      total
      active
      inactive
    }
  }
`;

export const CLIENTS_FOR_MAP_QUERY = gql`
  query ClientsForMap {
    clientsForMap {
      id
      name
      addressLine1
      city
      latitude
      longitude
    }
  }
`;

export const CREATE_CLIENT_MUTATION = gql`
  mutation CreateClient($input: CreateClientInput!) {
    createClient(input: $input) {
      id
      name
      city
    }
  }
`;

export const UPDATE_CLIENT_MUTATION = gql`
  mutation UpdateClient($id: String!, $input: UpdateClientInput!) {
    updateClient(id: $id, input: $input) {
      id
      name
      organization
      addressLine1
      addressLine2
      city
      region
      postalCode
      country
      phone
      email
      isActive
    }
  }
`;

export const DELETE_CLIENT_MUTATION = gql`
  mutation DeleteClient($id: String!) {
    deleteClient(id: $id) {
      id
    }
  }
`;

export const DELETE_ALL_CLIENTS_MUTATION = gql`
  mutation DeleteAllClients {
    deleteAllClients
  }
`;

export const FILIERES_QUERY = gql`
  query Filieres {
    filieres {
      id
      name
    }
  }
`;

export const ALL_FILIERES_QUERY = gql`
  query AllFilieres {
    allFilieres {
      id
      name
    }
  }
`;
