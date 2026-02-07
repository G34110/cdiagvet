import { gql } from '@apollo/client';

export const PRODUCTS_QUERY = gql`
  query Products($includeInactive: Boolean) {
    products(includeInactive: $includeInactive) {
      id
      code
      name
      description
      unitPrice
      isActive
      filiereId
      filiere {
        id
        name
        code
      }
    }
  }
`;

export const PRODUCT_QUERY = gql`
  query Product($id: String!) {
    product(id: $id) {
      id
      code
      name
      description
      unitPrice
      isActive
      filiereId
      filiere {
        id
        name
        code
      }
    }
  }
`;

export const PRODUCTS_BY_FILIERE_QUERY = gql`
  query ProductsByFiliere($filiereId: String!) {
    productsByFiliere(filiereId: $filiereId) {
      id
      code
      name
      description
      unitPrice
      isActive
    }
  }
`;

export const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      code
      name
      description
      unitPrice
      isActive
      filiereId
    }
  }
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      code
      name
      description
      unitPrice
      isActive
      filiereId
    }
  }
`;

export const DELETE_PRODUCT_MUTATION = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id) {
      id
    }
  }
`;

// Product Kits
export const PRODUCT_KITS_QUERY = gql`
  query ProductKits($includeInactive: Boolean) {
    productKits(includeInactive: $includeInactive) {
      id
      code
      name
      description
      price
      isActive
      items {
        id
        quantity
        product {
          id
          code
          name
          unitPrice
        }
      }
    }
  }
`;

export const PRODUCT_KIT_QUERY = gql`
  query ProductKit($id: String!) {
    productKit(id: $id) {
      id
      code
      name
      description
      price
      isActive
      items {
        id
        quantity
        product {
          id
          code
          name
          unitPrice
        }
      }
    }
  }
`;

export const CREATE_PRODUCT_KIT_MUTATION = gql`
  mutation CreateProductKit($input: CreateProductKitInput!) {
    createProductKit(input: $input) {
      id
      code
      name
      description
      price
      isActive
    }
  }
`;

export const UPDATE_PRODUCT_KIT_MUTATION = gql`
  mutation UpdateProductKit($id: String!, $input: UpdateProductKitInput!) {
    updateProductKit(id: $id, input: $input) {
      id
      code
      name
      description
      price
      isActive
    }
  }
`;

export const DELETE_PRODUCT_KIT_MUTATION = gql`
  mutation DeleteProductKit($id: String!) {
    deleteProductKit(id: $id) {
      id
    }
  }
`;
