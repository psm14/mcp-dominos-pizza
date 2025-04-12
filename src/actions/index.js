/**
 * Actions Registration
 *
 * Registers all MCP actions with the server
 */

// Import all action handlers
import { findNearbyStores } from "./findNearbyStores.js";
import { getMenu } from "./getMenu.js";
import { createOrder } from "./createOrder.js";
import { addItemToOrder } from "./addItemToOrder.js";
import { validateOrder } from "./validateOrder.js";
import { priceOrder } from "./priceOrder.js";
import { placeOrder } from "./placeOrder.js";
import { trackOrder } from "./trackOrder.js";

/**
 * Register all actions with the MCP server
 *
 * @param {Object} server - MCP server instance
 * @param {Object} sessionManager - Session manager instance
 */
export function registerActions(server, sessionManager) {
  // Find nearby stores action
  server.registerAction(
    {
      name: "findNearbyStores",
      description: "Find Domino's Pizza stores near an address",
      parameters: {
        type: "object",
        properties: {
          address: {
            type: "string",
            description: "Full address to search for nearby stores",
          },
        },
        required: ["address"],
      },
    },
    (params) => findNearbyStores(params, sessionManager)
  );

  // Get menu action
  server.registerAction(
    {
      name: "getMenu",
      description: "Get the menu for a specific Domino's store",
      parameters: {
        type: "object",
        properties: {
          storeId: {
            type: "string",
            description: "ID of the store to get menu from",
          },
        },
        required: ["storeId"],
      },
    },
    (params) => getMenu(params, sessionManager)
  );

  // Create order action
  server.registerAction(
    {
      name: "createOrder",
      description: "Create a new pizza order",
      parameters: {
        type: "object",
        properties: {
          storeId: {
            type: "string",
            description: "ID of the store to order from",
          },
          orderType: {
            type: "string",
            enum: ["delivery", "carryout"],
            description: "Type of order - delivery or carryout",
            default: "delivery",
          },
          customer: {
            type: "object",
            properties: {
              firstName: { type: "string" },
              lastName: { type: "string" },
              email: { type: "string" },
              phone: { type: "string" },
              address: {
                type: "string",
                description:
                  "Full address for delivery orders, can be omitted for carryout",
              },
            },
            required: ["firstName", "lastName", "phone"],
          },
        },
        required: ["storeId", "customer", "orderType"],
      },
    },
    (params) => createOrder(params, sessionManager)
  );

  // Add item to order action
  server.registerAction(
    {
      name: "addItemToOrder",
      description: "Add an item to an existing order",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "ID of the order to add item to",
          },
          item: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description:
                  "Menu code for the item (e.g., '14SCREEN' for large hand tossed pizza)",
              },
              options: {
                type: "object",
                description:
                  "Customization options for the item using single-letter codes from Domino's menu toppings",
              },
              quantity: {
                type: "integer",
                default: 1,
                description: "Number of this item to add",
              },
            },
            required: ["code"],
          },
        },
        required: ["orderId", "item"],
      },
    },
    (params) => addItemToOrder(params, sessionManager)
  );

  // Validate order action
  server.registerAction(
    {
      name: "validateOrder",
      description: "Validate an order before placing it",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "ID of the order to validate",
          },
        },
        required: ["orderId"],
      },
    },
    (params) => validateOrder(params, sessionManager)
  );

  // Price order action
  server.registerAction(
    {
      name: "priceOrder",
      description: "Price an order to get total cost",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "ID of the order to price",
          },
        },
        required: ["orderId"],
      },
    },
    (params) => priceOrder(params, sessionManager)
  );

  // Place order action
  server.registerAction(
    {
      name: "placeOrder",
      description: "Place an order with payment information",
      parameters: {
        type: "object",
        properties: {
          orderId: {
            type: "string",
            description: "ID of the order to place",
          },
          payment: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["credit", "cash"],
                description: "Payment method",
              },
              cardNumber: { type: "string" },
              expiration: { type: "string" },
              securityCode: { type: "string" },
              postalCode: { type: "string" },
              tipAmount: { type: "number" },
            },
            required: ["type"],
          },
        },
        required: ["orderId", "payment"],
      },
    },
    (params) => placeOrder(params, sessionManager)
  );

  // Track order action
  server.registerAction(
    {
      name: "trackOrder",
      description: "Track the status of an order",
      parameters: {
        type: "object",
        properties: {
          phoneNumber: {
            type: "string",
            description: "Phone number used for the order",
          },
          storeId: {
            type: "string",
            description: "ID of the store the order was placed at",
          },
          orderId: {
            type: "string",
            description: "Optional order ID if available",
          },
        },
        required: ["phoneNumber", "storeId"],
      },
    },
    (params) => trackOrder(params, sessionManager)
  );
}
