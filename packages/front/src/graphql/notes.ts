import { gql } from '@apollo/client';

export const CLIENT_NOTES_QUERY = gql`
  query ClientNotes($clientId: String!) {
    clientNotes(clientId: $clientId) {
      id
      content
      createdAt
      updatedAt
      authorId
      author {
        id
        firstName
        lastName
      }
    }
  }
`;

export const CREATE_NOTE_MUTATION = gql`
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      id
      content
      createdAt
      author {
        id
        firstName
        lastName
      }
    }
  }
`;

export const UPDATE_NOTE_MUTATION = gql`
  mutation UpdateNote($id: String!, $input: UpdateNoteInput!) {
    updateNote(id: $id, input: $input) {
      id
      content
      updatedAt
    }
  }
`;

export const DELETE_NOTE_MUTATION = gql`
  mutation DeleteNote($id: String!) {
    deleteNote(id: $id) {
      id
    }
  }
`;
