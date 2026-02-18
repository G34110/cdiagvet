import { gql } from '@apollo/client';

export const MY_CONTACTS_QUERY = gql`
  query MyContacts {
    myContacts {
      id
      firstName
      lastName
      phone
      email
      isPrimary
      clientId
      createdAt
      updatedAt
    }
  }
`;

export const CLIENT_CONTACTS_QUERY = gql`
  query ClientContacts($clientId: String!) {
    clientContacts(clientId: $clientId) {
      id
      firstName
      lastName
      phone
      email
      isPrimary
      clientId
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_CONTACT_MUTATION = gql`
  mutation CreateContact($input: CreateContactInput!) {
    createContact(input: $input) {
      id
      firstName
      lastName
      phone
      email
      isPrimary
      clientId
    }
  }
`;

export const UPDATE_CONTACT_MUTATION = gql`
  mutation UpdateContact($id: String!, $input: UpdateContactInput!) {
    updateContact(id: $id, input: $input) {
      id
      firstName
      lastName
      phone
      email
      isPrimary
    }
  }
`;

export const DELETE_CONTACT_MUTATION = gql`
  mutation DeleteContact($id: String!) {
    deleteContact(id: $id) {
      id
    }
  }
`;
