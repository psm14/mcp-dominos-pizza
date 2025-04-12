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
      "customer": {
        "type": "object",
        "properties": {
          "firstName": { "type": "string" },
          "lastName": { "type": "string" },
          "email": { "type": "string" },
          "phone": { "type": "string" },
          "address": { "type": "string" }
        },
        "required": ["firstName", "lastName", "phone", "address"]
      }
    },
    "required": ["storeId", "customer"]
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
