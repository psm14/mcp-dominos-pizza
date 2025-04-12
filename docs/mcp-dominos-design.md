# Domino's Pizza MCP Server Design Document

**Date:** April 11, 2025  
**Version:** 1.0.0  
**Author:** GitHub Copilot

## 1. Introduction

This document outlines the design for a Model Context Protocol (MCP) server that interfaces with the Domino's Pizza API. The server will provide a standardized interface for AI assistants to help users order pizza and track deliveries through conversational interfaces.

### 1.1 Purpose

The Domino's Pizza MCP server aims to:

- Enable natural language interactions for ordering pizza
- Abstract away the complexity of the Domino's API
- Provide a consistent interface for AI models to interact with Domino's services
- Support a wide range of pizza ordering use cases, from simple orders to complex customizations

### 1.2 Scope

The MCP server will support:

- Finding nearby Domino's stores
- Browsing menus and available items
- Creating and customizing orders
- Processing payments
- Order tracking
- Saving favorite orders and preferences

## 2. System Architecture

### 2.1 Overview

The system follows the MCP stdio standard architecture with:

- **MCP Stdio Interface**: Standard input/output interface following the MCP specification
- **Domain Logic Layer**: Business logic for pizza ordering flows
- **Domino's Integration Layer**: Interface with the Domino's API using the dominos npm package (v3.3.1)
- **In-Memory Session Storage**: For managing the state of ongoing orders and interactions

```
┌───────────────┐     ┌───────────────┐     ┌───────────────────┐     ┌───────────────┐
│               │     │               │     │                   │     │               │
│  MCP Client   ├─────►  MCP Stdio    ├─────►   Domain Logic    ├─────► Domino's API  │
│  (AI Model)   │     │  Interface    │     │                   │     │               │
│               │     │               │     │                   │     │               │
└───────────────┘     └───────────────┘     └───────────────────┘     └───────────────┘
```

### 2.2 Components

#### 2.2.1 MCP Stdio Interface

Implements the MCP specification using standard input/output for communication:

- Listens for JSON messages on stdin
- Responds with JSON messages on stdout
- Handles action discovery and execution
- Manages session state and context

#### 2.2.2 Domain Logic Layer

Implements the business logic for:

- Store location workflows
- Menu browsing workflows
- Order customization workflows
- Payment processing workflows
- Order tracking workflows

#### 2.2.3 Domino's Integration Layer

Adapts the dominos npm package (v3.3.1) for use within the MCP server:

- Address handling
- Store location
- Menu retrieval
- Order creation and validation
- Payment processing
- Order tracking

#### 2.2.4 In-Memory Session Storage

In-memory structures for maintaining state during an ordering session:

- Current order details
- Customer information
- Selected store information
- Temporary order history for the session duration

## 3. MCP Actions and Schemas

### 3.1 Core Actions

The following MCP actions will be supported:

#### 3.1.1 `findNearbyStores`

```json
{
  "name": "findNearbyStores",
  "description": "Find Domino's Pizza stores near an address",
  "parameters": {
    "type": "object",
    "properties": {
      "address": {
        "type": "string",
        "description": "Full address to search for nearby stores"
      }
    },
    "required": ["address"]
  }
}
```

#### 3.1.2 `getMenu`

```json
{
  "name": "getMenu",
  "description": "Get the menu for a specific Domino's store",
  "parameters": {
    "type": "object",
    "properties": {
      "storeId": {
        "type": "string",
        "description": "ID of the store to get menu from"
      }
    },
    "required": ["storeId"]
  }
}
```

#### 3.1.3 `createOrder`

```json
{
  "name": "createOrder",
  "description": "Create a new pizza order",
  "parameters": {
    "type": "object",
    "properties": {
      "storeId": {
        "type": "string",
        "description": "ID of the store to order from"
      },
      "orderType": {
        "type": "string",
        "enum": ["delivery", "carryout"],
        "description": "Type of order - delivery or carryout",
        "default": "delivery"
      },
      "customer": {
        "type": "object",
        "properties": {
          "firstName": { "type": "string" },
          "lastName": { "type": "string" },
          "email": { "type": "string" },
          "phone": { "type": "string" },
          "address": {
            "type": "string",
            "description": "Full address for delivery orders, can be omitted for carryout"
          }
        },
        "required": ["firstName", "lastName", "phone"]
      }
    },
    "required": ["storeId", "customer", "orderType"]
  }
}
```

#### 3.1.4 `addItemToOrder`

```json
{
  "name": "addItemToOrder",
  "description": "Add an item to an existing order",
  "parameters": {
    "type": "object",
    "properties": {
      "orderId": {
        "type": "string",
        "description": "ID of the order to add item to"
      },
      "item": {
        "type": "object",
        "properties": {
          "code": {
            "type": "string",
            "description": "Menu code for the item"
          },
          "options": {
            "type": "object",
            "description": "Customization options for the item"
          },
          "quantity": {
            "type": "integer",
            "default": 1,
            "description": "Number of this item to add"
          }
        },
        "required": ["code"]
      }
    },
    "required": ["orderId", "item"]
  }
}
```

#### 3.1.5 `validateOrder`

```json
{
  "name": "validateOrder",
  "description": "Validate an order before placing it",
  "parameters": {
    "type": "object",
    "properties": {
      "orderId": {
        "type": "string",
        "description": "ID of the order to validate"
      }
    },
    "required": ["orderId"]
  }
}
```

#### 3.1.6 `priceOrder`

```json
{
  "name": "priceOrder",
  "description": "Price an order to get total cost",
  "parameters": {
    "type": "object",
    "properties": {
      "orderId": {
        "type": "string",
        "description": "ID of the order to price"
      }
    },
    "required": ["orderId"]
  }
}
```

#### 3.1.7 `placeOrder`

```json
{
  "name": "placeOrder",
  "description": "Place an order with payment information",
  "parameters": {
    "type": "object",
    "properties": {
      "orderId": {
        "type": "string",
        "description": "ID of the order to place"
      },
      "payment": {
        "type": "object",
        "properties": {
          "type": {
            "type": "string",
            "enum": ["credit", "cash"],
            "description": "Payment method"
          },
          "cardNumber": { "type": "string" },
          "expiration": { "type": "string" },
          "securityCode": { "type": "string" },
          "postalCode": { "type": "string" },
          "tipAmount": { "type": "number" }
        },
        "required": ["type"]
      }
    },
    "required": ["orderId", "payment"]
  }
}
```

#### 3.1.8 `trackOrder`

```json
{
  "name": "trackOrder",
  "description": "Track the status of an order",
  "parameters": {
    "type": "object",
    "properties": {
      "phoneNumber": {
        "type": "string",
        "description": "Phone number used for the order"
      },
      "storeId": {
        "type": "string",
        "description": "ID of the store the order was placed at"
      },
      "orderId": {
        "type": "string",
        "description": "Optional order ID if available"
      }
    },
    "required": ["phoneNumber", "storeId"]
  }
}
```

## 3. Implementation Plan

### 3.1 Development Phases

#### Phase 1: Core Infrastructure

- Set up MCP server architecture
- Implement basic routing and MCP endpoints
- Set up integration with dominos npm package

#### Phase 2: Store and Menu Actions

- Implement store location functionality
- Implement menu browsing functionality
- Build action handlers for these features

#### Phase 3: Order Management

- Implement order creation
- Implement item customization
- Implement order validation and pricing

#### Phase 4: Payment & Tracking

- Implement payment processing
- Implement order tracking
- Security hardening for payment information

### 3.2 Technical Requirements

- Node.js v18+ runtime
- dominos npm package v3.3.1
- Jest for testing
- Docker for containerization (optional)

## 4. Integration with Models

### 4.1 Model Interactions

The MCP server is designed to work with AI models by providing:

- Clear action descriptions for discovery
- Structured parameter schemas for validation
- Consistent response formats for easy parsing
- Step-by-step guided workflows

### 4.2 Example Conversation Flows

#### Simple Order Flow

1. User asks to order a pizza
2. Model uses `findNearbyStores` to locate stores
3. Model uses `getMenu` to retrieve available options
4. Model helps user build order with `createOrder` and `addItemToOrder`
5. Model validates and prices order
6. Model collects payment information and places order
7. Model provides tracking information

### 4.3 Detailed Pizza Ordering Flow Example

Below is a detailed example flow showing the exact sequence of MCP action calls, server-side state management, and corresponding Domino's package API calls for a complete pizza ordering process.

#### Step 1: Finding Nearby Stores

**MCP Action Call**:

```json
{
  "name": "findNearbyStores",
  "parameters": {
    "address": "2 Portola Plaza, Monterey, CA 93940"
  }
}
```

**Server-Side Processing**:

1. Create Address object using the dominos package
2. Query for nearby stores
3. Save store information to session state

**Dominos Package Calls**:

```javascript
// Create a new Address object
const customerAddress = new Address("2 Portola Plaza, Monterey, CA 93940");

// Find nearby stores
const nearbyStores = await new NearbyStores(customerAddress);

// Filter for open delivery stores and sort by distance
const deliveryStores = nearbyStores.stores
  .filter(
    (store) =>
      store.IsOnlineCapable &&
      store.IsDeliveryStore &&
      store.IsOpen &&
      store.ServiceIsOpen.Delivery
  )
  .sort((a, b) => a.MinDistance - b.MinDistance);

// Save to session state
sessionState.stores = deliveryStores;
```

**MCP Response**:

```json
{
  "stores": [
    {
      "storeID": "7890",
      "address": "200 Del Monte Ave, Monterey, CA 93940",
      "phone": "831-555-1234",
      "isOpen": true,
      "allowsDelivery": true,
      "allowsCarryout": true,
      "estimatedDeliveryTime": "25-35 min",
      "distance": "1.2 miles"
    },
    ...
  ]
}
```

#### Step 2: Browsing the Menu

**MCP Action Call**:

```json
{
  "name": "getMenu",
  "parameters": {
    "storeId": "7890"
  }
}
```

**Server-Side Processing**:

1. Retrieve store from session state
2. Fetch menu using the dominos package
3. Format menu items for easy browsing
4. Save menu to session state

**Dominos Package Calls**:

```javascript
// Fetch the full menu for the selected store
const menu = await new Menu(sessionState.selectedStoreId);

// Process menu categories for easier browsing
const processedMenu = {
  pizzas: menu.getFoodCategory("Pizza"),
  sides: menu.getFoodCategory("Sides"),
  drinks: menu.getFoodCategory("Drinks"),
  desserts: menu.getFoodCategory("Dessert"),
};

// Save to session state
sessionState.menu = processedMenu;
```

**MCP Response**:

```json
{
  "categories": [
    {
      "name": "Pizzas",
      "items": [
        {
          "code": "16SCREEN",
          "name": "Large Hand Tossed Pizza",
          "description": "Hand Tossed Pizza with a rich, buttery taste",
          "basePrice": 13.99,
          "options": {
            "toppings": ["CHEESE", "PEPPERONI", "SAUSAGE", ...],
            "crusts": ["HANDTOSS", "THIN", "PAN", ...],
            "sauces": ["TOMATO", "MARINARA", "BBQ", ...]
          }
        },
        ...
      ]
    },
    ...
  ]
}
```

#### Step 3: Creating an Order

**MCP Action Call**:

```json
{
  "name": "createOrder",
  "parameters": {
    "storeId": "7890",
    "customer": {
      "firstName": "Brandon",
      "lastName": "Miller",
      "email": "brandon@example.com",
      "phone": "941-555-2368",
      "address": "2 Portola Plaza, Monterey, CA 93940"
    }
  }
}
```

**Server-Side Processing**:

1. Create a Customer object
2. Create a new Order associated with the customer
3. Set the store ID
4. Generate and save an order ID for session tracking
5. Save order to session state

**Dominos Package Calls**:

```javascript
// Create customer object
const customer = new Customer({
  firstName: "Brandon",
  lastName: "Miller",
  email: "brandon@example.com",
  phone: "941-555-2368",
  address: "2 Portola Plaza, Monterey, CA 93940",
});

// Create a new order for this customer
const order = new Order(customer);

// Set the store ID for the order
order.storeID = "7890";

// Generate a unique order ID for session tracking
const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Save to session state
sessionState.orders[orderId] = order;
```

**MCP Response**:

```json
{
  "orderId": "order-1712837642-123",
  "status": "created",
  "customer": {
    "firstName": "Brandon",
    "lastName": "Miller",
    "address": "2 Portola Plaza, Monterey, CA 93940"
  }
}
```

#### Step 4: Adding Items to Order

**MCP Action Call**:

```json
{
  "name": "addItemToOrder",
  "parameters": {
    "orderId": "order-1712837642-123",
    "item": {
      "code": "16SCREEN",
      "options": {
        "C": { "1/1": "1.5" }, // Extra cheese on whole pizza
        "P": { "1/2": "1.5" }, // Double pepperoni on half
        "X": { "1/1": "1" } // Normal sauce on whole pizza
      },
      "quantity": 1
    }
  }
}
```

**Server-Side Processing**:

1. Retrieve order from session state
2. Create a new Item using the dominos package
3. Add item to the order
4. Save updated order to session state

**Dominos Package Calls**:

```javascript
// Get the order from session state
const order = sessionState.orders[orderId];

// Create a new pizza item
const pizza = new Item({
  code: "16SCREEN",
  options: {
    C: { "1/1": "1.5" }, // Extra cheese on whole pizza
    P: { "1/2": "1.5" }, // Double pepperoni on half
    X: { "1/1": "1" }, // Normal sauce on whole pizza
  },
});

// Add the item to the order
order.addItem(pizza);

// Update session state
sessionState.orders[orderId] = order;
```

**MCP Response**:

```json
{
  "orderId": "order-1712837642-123",
  "status": "updated",
  "items": [
    {
      "code": "16SCREEN",
      "name": "Large Hand Tossed Pizza",
      "options": {
        "cheese": "Extra Cheese",
        "toppings": "Double Pepperoni on Half",
        "sauce": "Normal Tomato Sauce"
      },
      "quantity": 1
    }
  ]
}
```

#### Step 5: Validating the Order

**MCP Action Call**:

```json
{
  "name": "validateOrder",
  "parameters": {
    "orderId": "order-1712837642-123"
  }
}
```

**Server-Side Processing**:

1. Retrieve order from session state
2. Call validate method on the order
3. Update session state with validation results

**Dominos Package Calls**:

```javascript
// Get the order from session state
const order = sessionState.orders[orderId];

try {
  // Validate the order with Domino's API
  await order.validate();
  sessionState.orders[orderId] = order;
  sessionState.orderStatus = "validated";
} catch (error) {
  sessionState.orderErrors = error;
  sessionState.orderStatus = "validation_failed";
}
```

**MCP Response**:

```json
{
  "orderId": "order-1712837642-123",
  "status": "validated",
  "isValid": true
}
```

#### Step 6: Pricing the Order

**MCP Action Call**:

```json
{
  "name": "priceOrder",
  "parameters": {
    "orderId": "order-1712837642-123"
  }
}
```

**Server-Side Processing**:

1. Retrieve order from session state
2. Call price method on the order
3. Update session state with pricing information

**Dominos Package Calls**:

```javascript
// Get the order from session state
const order = sessionState.orders[orderId];

try {
  // Price the order with Domino's API
  await order.price();

  // Extract pricing breakdown
  const pricing = {
    subTotal: order.amountsBreakdown.menu,
    tax: order.amountsBreakdown.tax,
    delivery: order.amountsBreakdown.surcharge,
    total: order.amountsBreakdown.customer,
  };

  sessionState.orderPricing = pricing;
  sessionState.orders[orderId] = order;
} catch (error) {
  sessionState.orderErrors = error;
}
```

**MCP Response**:

```json
{
  "orderId": "order-1712837642-123",
  "status": "priced",
  "pricing": {
    "subTotal": 13.99,
    "tax": 1.15,
    "delivery": 3.99,
    "total": 19.13
  }
}
```

#### Step 7: Placing the Order

**MCP Action Call**:

```json
{
  "name": "placeOrder",
  "parameters": {
    "orderId": "order-1712837642-123",
    "payment": {
      "type": "credit",
      "cardNumber": "4100123422343234",
      "expiration": "01/28",
      "securityCode": "123",
      "postalCode": "93940",
      "tipAmount": 3.5
    }
  }
}
```

**Server-Side Processing**:

1. Retrieve order from session state
2. Create Payment object
3. Add payment to order
4. Call place method on the order
5. Update session state with order confirmation

**Dominos Package Calls**:

```javascript
// Get the order from session state
const order = sessionState.orders[orderId];

// Create payment object
const payment = new Payment({
  amount: order.amountsBreakdown.customer,
  number: "4100123422343234",
  expiration: "01/28",
  securityCode: "123",
  postalCode: "93940",
  tipAmount: 3.5,
});

// Add payment to order
order.payments.push(payment);

try {
  // Place the order with Domino's API
  await order.place();

  // Extract order confirmation details
  const confirmation = {
    orderID: order.orderID,
    estimatedWaitMinutes: order.estimatedWaitMinutes,
    status: order.status,
  };

  sessionState.orderConfirmation = confirmation;
  sessionState.orders[orderId] = order;
} catch (error) {
  sessionState.orderErrors = error;
}
```

**MCP Response**:

```json
{
  "orderId": "order-1712837642-123",
  "status": "placed",
  "confirmation": {
    "dominosOrderId": "ABC123XYZ",
    "estimatedDeliveryTime": "30-40 minutes",
    "orderStatus": "In Preparation"
  }
}
```

#### Step 8: Tracking the Order

**MCP Action Call**:

```json
{
  "name": "trackOrder",
  "parameters": {
    "phoneNumber": "941-555-2368",
    "storeId": "7890"
  }
}
```

**Server-Side Processing**:

1. Create a new Tracking instance
2. Call the tracking by phone method
3. Format tracking response for easy understanding

**Dominos Package Calls**:

```javascript
// Create tracking object
const tracking = new Tracking();

try {
  // Track order by phone number
  const trackingResult = await tracking.byPhone("9415552368");

  // Format tracking information
  const orderStatus = {
    status: trackingResult.OrderStatus,
    estimatedDeliveryTime: trackingResult.EstimatedDeliveryTime,
    orderDescription: trackingResult.OrderDescription,
    deliveryAddress: trackingResult.Address,
  };

  sessionState.trackingInfo = orderStatus;
} catch (error) {
  sessionState.trackingErrors = error;
}
```

**MCP Response**:

```json
{
  "status": "Out for Delivery",
  "estimatedDeliveryTime": "5-15 minutes",
  "orderDetails": {
    "items": ["Large Hand Tossed Pizza"],
    "placedAt": "2025-04-11T15:30:00Z"
  },
  "tracker": {
    "orderPlaced": true,
    "preparation": true,
    "baking": true,
    "qualityCheck": true,
    "outForDelivery": true,
    "delivered": false
  }
}
```

This detailed flow demonstrates how the MCP server acts as an intermediary between AI models and the Domino's API, handling all the complex interaction logic while providing a simple, consistent interface for the models to use.

### 4.4 Carryout Order Flow Example

Below is a detailed example of a carryout order flow, showing the key differences from the delivery flow.

#### Step 1: Finding Nearby Stores

**MCP Action Call**:

```json
{
  "name": "findNearbyStores",
  "parameters": {
    "address": "2 Portola Plaza, Monterey, CA 93940"
  }
}
```

**Server-Side Processing**:

```javascript
// Create a new Address object
const customerAddress = new Address("2 Portola Plaza, Monterey, CA 93940");

// Find nearby stores
const nearbyStores = await new NearbyStores(customerAddress);

// Filter for open carryout stores and sort by distance
const carryoutStores = nearbyStores.stores
  .filter(
    (store) =>
      store.IsOnlineCapable && store.IsOpen && store.ServiceIsOpen.Carryout
  )
  .sort((a, b) => a.MinDistance - b.MinDistance);

// Save to session state
sessionState.stores = carryoutStores;
```

**MCP Response**:

```json
{
  "stores": [
    {
      "storeID": "7890",
      "address": "200 Del Monte Ave, Monterey, CA 93940",
      "phone": "831-555-1234",
      "isOpen": true,
      "allowsDelivery": true,
      "allowsCarryout": true,
      "estimatedCarryoutTime": "15-20 min",
      "distance": "1.2 miles"
    },
    ...
  ]
}
```

#### Step 2: Creating a Carryout Order

**MCP Action Call**:

```json
{
  "name": "createOrder",
  "parameters": {
    "storeId": "7890",
    "orderType": "carryout",
    "customer": {
      "firstName": "Brandon",
      "lastName": "Miller",
      "email": "brandon@example.com",
      "phone": "941-555-2368"
      // Note: No address required for carryout
    }
  }
}
```

**Server-Side Processing**:

```javascript
// Create customer object
const customer = new Customer({
  firstName: "Brandon",
  lastName: "Miller",
  email: "brandon@example.com",
  phone: "941-555-2368",
  // No address for carryout orders
});

// Create a new order for this customer
const order = new Order(customer);

// Set the store ID for the order
order.storeID = "7890";

// Set service method to carryout
order.serviceMethod = "Carryout";

// Generate a unique order ID for session tracking
const orderId = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

// Save to session state
sessionState.orders[orderId] = order;
```

**MCP Response**:

```json
{
  "orderId": "order-1712837642-123",
  "status": "created",
  "orderType": "carryout",
  "customer": {
    "firstName": "Brandon",
    "lastName": "Miller"
  },
  "store": {
    "storeId": "7890",
    "address": "200 Del Monte Ave, Monterey, CA 93940"
  }
}
```

#### Step 3: Adding Items to Order

This step is identical to the delivery flow.

#### Step 4: Validating and Pricing the Order

The validation and pricing steps are similar to the delivery flow, but with no delivery fee in the pricing breakdown.

**MCP Response for Pricing**:

```json
{
  "orderId": "order-1712837642-123",
  "status": "priced",
  "pricing": {
    "subTotal": 13.99,
    "tax": 1.15,
    "total": 15.14
    // Note: No delivery fee for carryout orders
  }
}
```

#### Step 5: Placing the Carryout Order

**MCP Action Call**:

```json
{
  "name": "placeOrder",
  "parameters": {
    "orderId": "order-1712837642-123",
    "payment": {
      "type": "credit",
      "cardNumber": "4100123422343234",
      "expiration": "01/28",
      "securityCode": "123",
      "postalCode": "93940"
      // Note: No tip for carryout orders
    }
  }
}
```

**Server-Side Processing**:

```javascript
// Get the order from session state
const order = sessionState.orders[orderId];

// Create payment object
const payment = new Payment({
  amount: order.amountsBreakdown.customer,
  number: "4100123422343234",
  expiration: "01/28",
  securityCode: "123",
  postalCode: "93940",
  // No tip for carryout orders
});

// Add payment to order
order.payments.push(payment);

try {
  // Place the order with Domino's API
  await order.place();

  // Extract order confirmation details
  const confirmation = {
    orderID: order.orderID,
    estimatedWaitMinutes: order.estimatedWaitMinutes,
    status: order.status,
    storeAddress: order.storeAddress,
  };

  // For carryout orders, include pickup instructions
  confirmation.pickupInstructions =
    "Please bring your order confirmation and payment card for verification.";
  confirmation.readyTime = new Date(
    Date.now() + order.estimatedWaitMinutes * 60000
  ).toLocaleTimeString();

  sessionState.orderConfirmation = confirmation;
} catch (error) {
  sessionState.orderErrors = error;
}
```

**MCP Response**:

```json
{
  "orderId": "order-1712837642-123",
  "status": "placed",
  "orderType": "carryout",
  "confirmation": {
    "dominosOrderId": "ABC123XYZ",
    "estimatedReadyTime": "5:45 PM",
    "orderStatus": "In Preparation",
    "pickupLocation": "200 Del Monte Ave, Monterey, CA 93940",
    "pickupInstructions": "Please bring your order confirmation and payment card for verification."
  }
}
```

#### Step 6: Tracking the Carryout Order

The tracking functionality is similar to delivery orders, but with carryout-specific status information.

**MCP Response**:

```json
{
  "status": "Ready for Pickup",
  "estimatedReadyTime": "Ready now",
  "orderDetails": {
    "items": ["Large Hand Tossed Pizza"],
    "placedAt": "2025-04-11T15:30:00Z"
  },
  "tracker": {
    "orderPlaced": true,
    "preparation": true,
    "baking": true,
    "qualityCheck": true,
    "readyForPickup": true,
    "pickedUp": false
  },
  "pickupLocation": "200 Del Monte Ave, Monterey, CA 93940"
}
```

This carryout flow demonstrates the key differences when handling carryout orders compared to delivery orders, including:

1. No delivery address required when creating the order
2. Setting the service method to "Carryout" in the Domino's API
3. No delivery fees in the pricing structure
4. No tip amount in the payment process
5. Different tracking statuses (ready for pickup vs. out for delivery)
6. Additional pickup-specific instructions and information
