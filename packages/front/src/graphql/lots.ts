import { gql } from '@apollo/client';

export const SCAN_BARCODE_MUTATION = gql`
  mutation ScanBarcode($input: ScanBarcodeInput!) {
    scanBarcode(input: $input) {
      success
      message
      lot {
        id
        lotNumber
        expirationDate
        product {
          id
          gtin
          name
        }
      }
      gtin
      lotNumber
      expirationDate
      productName
      isNewProduct
    }
  }
`;

export const ASSOCIATE_LOT_CLIENT_MUTATION = gql`
  mutation AssociateLotToClient($input: AssociateLotClientInput!) {
    associateLotToClient(input: $input) {
      id
      quantity
      deliveryDate
      lot {
        id
        lotNumber
        product {
          name
          gtin
        }
      }
      clientName
    }
  }
`;

export const LOT_TRACEABILITY_QUERY = gql`
  query LotTraceability($lotId: ID!) {
    lotTraceability(lotId: $lotId) {
      lot {
        id
        lotNumber
        expirationDate
        rawBarcode
        createdAt
        product {
          id
          gtin
          name
        }
      }
      deliveries {
        id
        quantity
        deliveryDate
        clientId
        clientName
        clientAddress
        clientCity
        clientPostalCode
      }
      totalQuantity
      clientCount
    }
  }
`;

export const SEARCH_LOTS_QUERY = gql`
  query SearchLots($query: String!) {
    searchLots(query: $query) {
      id
      lotNumber
      expirationDate
      createdAt
      product {
        id
        gtin
        name
      }
    }
  }
`;

export const CLIENT_LOTS_QUERY = gql`
  query ClientLots($clientId: ID!) {
    clientLots(clientId: $clientId) {
      id
      quantity
      deliveryDate
      lot {
        id
        lotNumber
        expirationDate
        product {
          id
          gtin
          name
        }
      }
    }
  }
`;

export const ALL_LOTS_QUERY = gql`
  query AllLots($search: String) {
    allLots(search: $search) {
      id
      lotNumber
      expirationDate
      rawBarcode
      createdAt
      product {
        id
        gtin
        name
      }
    }
  }
`;
