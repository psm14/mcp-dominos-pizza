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
            "description": "Full address. Required for delivery orders. For carryout orders paid by credit card, this address is used as the billing address and is required."
          }
        },
        "required": ["firstName", "lastName", "phone"] // Address becomes conditionally required based on order/payment type
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
            "description": "Menu code for the item (e.g., '14SCREEN' for large hand tossed pizza)"
          },
          "options": {
            "type": "object",
            "description": "Customization options for the item using single-letter codes from Domino's menu toppings (see 'Topping and Option Codes' section)"
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
          "postalCode": {
            "type": "string",
            "description": "Billing postal code for credit card payments."
          },
          "tipAmount": { "type": "number" }
        },
        "required": ["type"] // Card details are required if type is 'credit'
      }
    },
    "required": ["orderId", "payment"]
  }
}
```

## 3. Topping and Option Codes

### 3.1 Understanding Domino's Topping Codes

The Domino's API uses single-letter codes to represent toppings and customization options. These codes are found in the `menu.Toppings` section of the Domino's menu API response. Understanding these codes is essential for adding items to an order.

### 3.2 Common Pizza Topping Codes

Here are the most common topping codes for pizzas:

| Code | Description                  | Type      |
| ---- | ---------------------------- | --------- |
| X    | Robust Inspired Tomato Sauce | Sauce     |
| Xm   | Marinara Sauce               | Sauce     |
| Xw   | White Sauce                  | Sauce     |
| Bq   | BBQ Sauce                    | Sauce     |
| C    | Cheese                       | Cheese    |
| P    | Pepperoni                    | Meat      |
| H    | Ham                          | Meat      |
| B    | Beef                         | Meat      |
| S    | Italian Sausage              | Meat      |
| Du   | Philly Steak                 | Meat      |
| K    | Bacon                        | Meat      |
| Si   | Spinach                      | Vegetable |
| M    | Mushroom                     | Vegetable |
| O    | Onion                        | Vegetable |
| G    | Green Peppers                | Vegetable |
| R    | Roasted Red Peppers          | Vegetable |
| J    | Jalapeño Peppers             | Vegetable |

### 3.3 Portion and Quantity Format

When specifying toppings, you need to define both the portion of the pizza and the quantity of the topping:

#### Portion Format

- `"1/1"`: The whole pizza
- `"1/2"`: Half of the pizza
- `"2/2"`: The other half of the pizza

#### Quantity Values

- `"0"`: None
- `"0.5"`: Light amount
- `"1"`: Normal amount
- `"1.5"`: Extra amount
- `"2"`: Double amount

### 3.4 Example Options Object

```javascript
{
  "options": {
    "X": { "1/1": "1" },    // Normal tomato sauce on the whole pizza
    "C": { "1/1": "1.5" },  // Extra cheese on the whole pizza
    "P": { "1/2": "2" },    // Double pepperoni on the first half
    "M": { "2/2": "1" }     // Normal mushrooms on the second half
  }
}
```

### 3.5 Finding Available Toppings

For each product, the Domino's API provides `AvailableToppings` that lists the valid topping codes. For example, a standard pizza might have:

```
"AvailableToppings": "X=0:0.5:1:1.5,Xm=0:0.5:1:1.5,Bq,Xw=0:0.5:1:1.5,C,H,B,Sa,P,S,Du,K,Pm,Ht,F,J,O,Z,Td,R,M,N,Cp,E,G,Si,Rr,Fe,Cs,Xf=0:0.5:1:1.5,Rd"
```

This string indicates all valid toppings for the item along with the quantities allowed for each (when specified after an equals sign).

### 3.6 Division of Responsibilities for Topping Codes

#### LLM Client Responsibilities:

1. Translate user-friendly descriptions ("extra cheese", "pepperoni on half") into the appropriate code format as documented in sections 3.2-3.4
2. Provide properly formatted option codes when calling the `addItemToOrder` action

#### MCP Server Responsibilities:

1. Provide topping code information in the menu response for the LLM to reference
2. Validate topping choices against the available toppings for the selected product
3. Pass the properly formatted options to the Domino's API without modification

This division ensures that the LLM can maintain contextual understanding of the user's requests while the MCP server focuses on API integration and validation.

## 4. Implementation Plan

### 4.1 Development Phases

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
- Node.js native test runner for testing
- To be run via `npx` command

## 5. Integration with Models

### 5.1 Model Interactions

The MCP server is designed to work with AI models by providing:

- Clear action descriptions for discovery
- Structured parameter schemas for validation
- Consistent response formats for easy parsing
- Step-by-step guided workflows

### 5.2 Example Conversation Flows

#### Simple Order Flow

1. User asks to order a pizza
2. Model uses `findNearbyStores` to locate stores
3. Model uses `getMenu` to retrieve available options
4. Model helps user build order with `createOrder` and `addItemToOrder`
5. Model validates and prices order
6. Model collects payment information and places order
7. Model provides tracking information

### 5.3 Detailed Pizza Ordering Flow Example

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

// Save the raw menu data in the session for later use
sessionManager.setMenu(menu);

// Process menu categories for easier browsing
const categories = [];

// Access the raw menu data structure
const menuData = menu.dominosAPIResponse;

// Check if we have products to categorize
if (menuData && menuData.Products) {
  // Group products by category
  const categorizedProducts = {};

  // Iterate through all products and categorize them
  Object.values(menuData.Products).forEach((product) => {
    const category = product.ProductType || "Other";
    if (!categorizedProducts[category]) {
      categorizedProducts[category] = [];
    }
    categorizedProducts[category].push(product);
  });

  // Add pizza category if available
  if (categorizedProducts.Pizza && categorizedProducts.Pizza.length > 0) {
    categories.push({
      name: "Pizzas",
      items: processMenuItems(categorizedProducts.Pizza, menuData),
    });
  }

  // Add sides category if available
  if (categorizedProducts.Sides && categorizedProducts.Sides.length > 0) {
    categories.push({
      name: "Sides",
      items: processMenuItems(categorizedProducts.Sides, menuData),
    });
  }

  // Add drinks and desserts categories similarly...
}

// Save to session state
sessionState.processedMenu = categories;
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
            "toppings": [
              {
                "name": "Cheese",
                "code": "C",
                "allowedQuantities": ["0", "1", "1.5", "2"]
              },
              {
                "name": "Pepperoni",
                "code": "P",
                "allowedQuantities": ["0", "0.5", "1", "1.5", "2"]
              },
              {
                "name": "Italian Sausage",
                "code": "S",
                "allowedQuantities": ["0", "0.5", "1", "1.5", "2"]
              },
              {
                "name": "Beef",
                "code": "B",
                "allowedQuantities": ["0", "0.5", "1", "1.5", "2"]
              },
              {
                "name": "Ham",
                "code": "H",
                "allowedQuantities": ["0", "0.5", "1", "1.5", "2"]
              },
              {
                "name": "Bacon",
                "code": "K",
                "allowedQuantities": ["0", "0.5", "1", "1.5", "2"]
              },
              {
                "name": "Mushrooms",
                "code": "M",
                "allowedQuantities": ["0", "0.5", "1", "1.5", "2"]
              },
              {
                "name": "Onions",
                "code": "O",
                "allowedQuantities": ["0", "0.5", "1", "1.5", "2"]
              },
              {
                "name": "Green Peppers",
                "code": "G",
                "allowedQuantities": ["0", "0.5", "1", "1.5", "2"]
              }
            ]
          }
        },
        {
          "code": "14SCREEN",
          "name": "Medium Hand Tossed Pizza",
          "description": "Hand Tossed Pizza with a rich, buttery taste",
          "basePrice": 11.99,
          "options": {
            "toppings": [
              {
                "name": "Cheese",
                "code": "C",
                "allowedQuantities": ["0", "1", "1.5", "2"]
              },
              {
                "name": "Pepperoni",
                "code": "P",
                "allowedQuantities": ["0", "0.5", "1", "1.5", "2"]
              },
              {
                "name": "Italian Sausage",
                "code": "S",
                "allowedQuantities": ["0", "0.5", "1", "1.5", "2"]
              }
              // Additional toppings similar to above
            ]
          }
        }
      ]
    },
    {
      "name": "Sides",
      "items": [
        {
          "code": "B8PCDD",
          "name": "8-Piece Chicken Wings",
          "description": "Marinated and oven-baked to perfection",
          "basePrice": 8.99,
          "options": {
            "sides": [
              {
                "name": "Ranch Dipping Cup",
                "code": "RANCH",
                "allowedQuantities": ["0", "1", "2"]
              },
              {
                "name": "Blue Cheese Dipping Cup",
                "code": "BLUECHS",
                "allowedQuantities": ["0", "1", "2"]
              }
            ]
          }
        }
      ]
    }
  ],
  "toppingCodes": {
    "mapping": "See 'Topping and Option Codes' section for details on how to use these codes when adding items to an order"
  }
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

> See the "Topping and Option Codes" section for a detailed explanation of the option coding system.

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
        ...
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
2. Create Payment object using the dominos package, ensuring billing address details (from customer object) and postal code are included for credit card payments.
3. Add payment to order
4. Call place method on the order
5. Update session state with order confirmation

**Dominos Package Calls**:

```javascript
// Get the order from session state
const order = sessionState.orders[orderId];

// Create payment object
const paymentInfo = parameters.payment;
const customerInfo = order.Customer; // Retrieve customer info stored in the order

const payment = new Payment({
  Type: paymentInfo.type === "credit" ? "CreditCard" : "Cash", // Map to Domino's expected type
  Amount: order.Amounts.Customer, // Use the priced amount
  Number: paymentInfo.cardNumber,
  Expiration: paymentInfo.expiration,
  SecurityCode: paymentInfo.securityCode,
  PostalCode: paymentInfo.postalCode, // Billing postal code
  TipAmount: paymentInfo.tipAmount,

  // Include billing address details for credit card payments
  // Assumes the address stored in the customer object is the billing address
  ...(paymentInfo.type === "credit" &&
    customerInfo.Address && {
      CardType: order.validate().allowedCards[0], // Use the first allowed card type (needs refinement)
      Address: customerInfo.Address.street, // Assuming Address object structure
      City: customerInfo.Address.city,
      Region: customerInfo.Address.region,
      // PostalCode is already included above
    }),
});

// Add payment to the order
order.addPayment(payment);

try {
  // Place the order with Domino's API
  await order.place();
  sessionState.orderConfirmation = order.details; // Store confirmation details
  sessionState.orderStatus = "placed";
} catch (error) {
  sessionState.orderErrors = error;
  sessionState.orderStatus = "placement_failed";
  // Rethrow or handle error appropriately
  throw new Error(`Failed to place order: ${error.message}`);
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
