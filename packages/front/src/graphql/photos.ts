import { gql } from '@apollo/client';

export const VISIT_PHOTOS_QUERY = gql`
  query VisitPhotos($visitId: String!) {
    visitPhotos(visitId: $visitId) {
      id
      url
      caption
      createdAt
    }
  }
`;

export const CLIENT_PHOTOS_QUERY = gql`
  query ClientPhotos($clientId: String!) {
    clientPhotos(clientId: $clientId) {
      id
      url
      caption
      createdAt
      visitId
    }
  }
`;

export const CREATE_PHOTO_MUTATION = gql`
  mutation CreatePhoto($input: CreatePhotoInput!) {
    createPhoto(input: $input) {
      id
      url
      caption
      createdAt
    }
  }
`;

export const DELETE_PHOTO_MUTATION = gql`
  mutation DeletePhoto($id: String!) {
    deletePhoto(id: $id) {
      id
    }
  }
`;
