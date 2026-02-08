import { gql } from '@apollo/client';

export const ORDERS_QUERY = gql`
  query Orders {
    orders {
      id
      reference
      status
      totalHT
      totalTTC
      taxRate
      expectedDelivery
      deliveredAt
      trackingNumber
      notes
      createdAt
      updatedAt
      validatedAt
      clientId
      ownerId
      opportunityId
      client {
        id
        name
        organization
        city
      }
      owner {
        id
        firstName
        lastName
      }
      lines {
        id
        productName
        productCode
        quantity
        unitPrice
        total
        productId
        kitId
      }
    }
  }
`;

export const ORDERS_BY_STATUS_QUERY = gql`
  query OrdersByStatus($status: OrderStatus!) {
    ordersByStatus(status: $status) {
      id
      reference
      status
      totalHT
      totalTTC
      expectedDelivery
      createdAt
      client {
        id
        name
        city
      }
      owner {
        id
        firstName
        lastName
      }
    }
  }
`;

export const ORDER_QUERY = gql`
  query Order($id: String!) {
    order(id: $id) {
      id
      reference
      status
      totalHT
      totalTTC
      taxRate
      expectedDelivery
      deliveredAt
      trackingNumber
      notes
      createdAt
      updatedAt
      validatedAt
      clientId
      ownerId
      opportunityId
      client {
        id
        name
        organization
        email
        phone
        addressLine1
        city
        postalCode
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
        productCode
        quantity
        unitPrice
        total
        productId
        kitId
      }
    }
  }
`;

export const CREATE_ORDER_MUTATION = gql`
  mutation CreateOrder($input: CreateOrderInput!) {
    createOrder(input: $input) {
      id
      reference
      status
    }
  }
`;

export const UPDATE_ORDER_MUTATION = gql`
  mutation UpdateOrder($input: UpdateOrderInput!) {
    updateOrder(input: $input) {
      id
      reference
      status
      notes
      expectedDelivery
      trackingNumber
    }
  }
`;

export const UPDATE_ORDER_STATUS_MUTATION = gql`
  mutation UpdateOrderStatus($input: UpdateOrderStatusInput!) {
    updateOrderStatus(input: $input) {
      id
      reference
      status
      validatedAt
      deliveredAt
      trackingNumber
    }
  }
`;

export const VALIDATE_ORDER_MUTATION = gql`
  mutation ValidateOrder($id: String!) {
    validateOrder(id: $id) {
      id
      reference
      status
      validatedAt
    }
  }
`;

export const CANCEL_ORDER_MUTATION = gql`
  mutation CancelOrder($id: String!) {
    cancelOrder(id: $id) {
      id
      reference
      status
    }
  }
`;

export const DELETE_ORDER_MUTATION = gql`
  mutation DeleteOrder($id: String!) {
    deleteOrder(id: $id)
  }
`;

export const ADD_ORDER_LINE_MUTATION = gql`
  mutation AddOrderLine($orderId: String!, $line: CreateOrderLineInput!) {
    addOrderLine(orderId: $orderId, line: $line) {
      id
      totalHT
      totalTTC
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

export const UPDATE_ORDER_LINE_MUTATION = gql`
  mutation UpdateOrderLine($lineId: String!, $quantity: Int!) {
    updateOrderLine(lineId: $lineId, quantity: $quantity) {
      id
      totalHT
      totalTTC
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

export const REMOVE_ORDER_LINE_MUTATION = gql`
  mutation RemoveOrderLine($lineId: String!) {
    removeOrderLine(lineId: $lineId) {
      id
      totalHT
      totalTTC
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

export const CONVERT_OPPORTUNITY_TO_ORDER = gql`
  mutation ConvertOpportunityToOrder($opportunityId: String!) {
    convertOpportunityToOrder(opportunityId: $opportunityId) {
      id
      reference
      status
      totalHT
      totalTTC
      client {
        id
        name
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
