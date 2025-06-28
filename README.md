# Domino's Pizza MCP Server

> [!WARNING]
> **THIS PROJECT DOES NOT CURRENTLY WORK**
>
> **The Domino's API requires reCAPTCHA verification when placing orders, and there is no programmatic way to solve reCAPTCHA challenges. This means while you can browse stores, menus, create orders, and validate them, the actual order placement will fail due to the reCAPTCHA requirement.**

A Model Context Protocol (MCP) server that provides AI assistants with the ability to interact with the Domino's Pizza API. This server enables natural language conversations for browsing menus, creating orders, and tracking deliveries through a standardized interface.

## Features

- **Store Locator**: Find nearby Domino's locations
- **Menu Browsing**: Explore available pizzas, sides, and drinks
- **Order Creation**: Build custom orders with detailed topping specifications
- **Order Management**: Add/remove items, validate orders, and get pricing
- **Payment Processing**: Support for credit card and cash payments *(blocked by reCAPTCHA)*
- **Order Tracking**: Monitor order status and estimated delivery times

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

## Usage

This MCP server is designed to be used with AI assistants that support the Model Context Protocol. The server provides the following tools:

### Core Tools

- `findNearbyStores` - Locate Domino's stores near an address
- `getMenu` - Retrieve menu items for a specific store
- `createOrder` - Initialize a new order with customer information
- `addItemToOrder` - Add pizzas, sides, and drinks to an order
- `removeItemFromOrder` - Remove items from an existing order
- `getOrderState` - View current order contents and status
- `validateOrder` - Check if an order is valid before pricing
- `priceOrder` - Calculate total cost including taxes and fees
- `placeOrder` - ⚠️ **FAILS DUE TO RECAPTCHA** - Attempt to submit the order
- `trackOrder` - Monitor order status and delivery progress

### Example Conversation Flow

```
User: "I want to order a large pepperoni pizza for delivery"

Assistant uses tools:
1. findNearbyStores(address: "user's address")
2. getMenu(storeId: "selected store")
3. createOrder(storeId, customer info, address)
4. addItemToOrder(orderId, large pepperoni pizza)
5. validateOrder(orderId)
6. priceOrder(orderId)
7. placeOrder(orderId, payment info)
```

## API Reference

### Pizza Customization

The server supports detailed pizza customization using Domino's topping codes:

```javascript
// Example: Large pizza with extra pepperoni on left half, mushrooms on whole pizza
{
  code: "14SCREEN", // Large pizza code
  options: {
    "P": { "1/2": "1.5" }, // Extra pepperoni on left half
    "M": { "1/1": "1" }    // Normal mushrooms on whole pizza
  }
}
```

**Portion Codes:**
- `1/1` - Whole pizza
- `1/2` - Left half
- `2/2` - Right half

**Quantity Codes:**
- `0.5` - Light amount
- `1` - Normal amount
- `1.5` - Extra amount
- `2` - Double amount

### Common Topping Codes

| Topping | Code |
|---------|------|
| Pepperoni | P |
| Mushrooms | M |
| Italian Sausage | S |
| Ham | H |
| Bacon | B |
| Beef | Be |
| Chicken | Du |
| Green Peppers | G |
| Onions | O |
| Black Olives | R |
| Cheese | C |

## Configuration

The server uses the following configuration:

- **Name**: "Domino's Pizza MCP"
- **Version**: "1.0.0"
- **Transport**: stdio (Standard Input/Output)
- **Session Management**: In-memory storage

## Development

### Project Structure

```
src/
├── index.js              # Main server entry point
├── actions/
│   ├── index.js          # Action registration
│   ├── findNearbyStores.js
│   ├── getMenu.js
│   ├── createOrder.js
│   ├── addItemToOrder.js
│   ├── removeItemFromOrder.js
│   ├── getOrderState.js
│   ├── validateOrder.js
│   ├── priceOrder.js
│   ├── placeOrder.js
│   └── trackOrder.js
└── utils/
    └── sessionManager.js  # In-memory session storage
```

### Running Tests

```bash
npm test
```

### Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `dominos` - Unofficial Domino's API client
- `uuid` - Unique identifier generation
- `zod` - Schema validation

## Legal Notice

This project is for educational purposes only. It uses the unofficial `dominos` npm package to interact with Domino's publicly available APIs. Users should respect Domino's terms of service and rate limits.

The project is not affiliated with, endorsed by, or sponsored by Domino's Pizza.

## Contributing

Contributions are welcome, especially if you can make ordering actually work!

## License

MIT License - see LICENSE file for details.

---

**Remember**: This is a proof-of-concept that demonstrates MCP integration patterns. The core functionality works up until the actual order placement, which is blocked by Domino's reCAPTCHA protection.
