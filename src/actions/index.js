/**
 * Actions Registration
 *
 * Registers all MCP tools with the server
 */

import { z } from "zod";

// Import all action handlers
import { findNearbyStores } from "./findNearbyStores.js";
import { getMenu } from "./getMenu.js";
import { createOrder } from "./createOrder.js";
import { addItemToOrder } from "./addItemToOrder.js";
import { removeItemFromOrder } from "./removeItemFromOrder.js"; // Added import
import { getOrderState } from "./getOrderState.js"; // Added import
import { validateOrder } from "./validateOrder.js";
import { priceOrder } from "./priceOrder.js";
import { placeOrder } from "./placeOrder.js";
import { trackOrder } from "./trackOrder.js";

/**
 * Register all tools with the MCP server
 *
 * @param {Object} server - MCP server instance
 * @param {Object} sessionManager - Session manager instance
 */
export async function registerActions(server, sessionManager) {
  // Find nearby stores tool
  server.tool(
    "findNearbyStores",
    "Find Domino's Pizza stores near an address",
    {
      address: z.string().describe("Full address to search for nearby stores"),
    },
    async (params) => {
      const result = await findNearbyStores(params, sessionManager);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Get menu tool
  server.tool(
    "getMenu",
    "Get the menu for a specific Domino's store",
    {
      storeId: z.string().describe("ID of the store to get menu from"),
    },
    async (params) => {
      const result = await getMenu(params, sessionManager);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Create order tool
  server.tool(
    "createOrder",
    "Create a new pizza order",
    {
      storeId: z.string().describe("ID of the store to order from"),
      orderType: z
        .enum(["delivery", "carryout"])
        .describe("Type of order - delivery or carryout")
        .default("delivery"),
      customer: z
        .object({
          firstName: z.string(),
          lastName: z.string(),
          email: z.string().optional(),
          phone: z.string(),
          address: z
            .object({
              street: z.string(), // Made required
              streetName: z.string().optional(),
              streetNumber: z.string().optional(),
              unitType: z.string().optional(),
              unitNumber: z.string().optional(),
              city: z.string(), // Made required
              region: z.string(), // Made required
              postalCode: z.string(), // Made required
              deliveryInstructions: z.string().optional(),
            })
            .describe(
              "Address object. Required for delivery orders. For carryout orders paid by credit card, this address is used as the billing address and is required."
            )
            .optional(), // Keep the whole address object optional for carryout without CC
        })
        .describe("Customer information"),
    },
    async (params) => {
      const result = await createOrder(params, sessionManager);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Add item to order tool
  server.tool(
    "addItemToOrder",
    "Add an item to an existing order",
    {
      orderId: z.string().describe("ID of the order to add item to"),
      item: z
        .object({
          code: z.string().describe("Menu code for the item"),
          options: z
            .record(z.any())
            .describe(
              "Customization options using single-letter codes (e.g., 'P' for Pepperoni). Format: { 'ToppingCode': { 'Portion': 'Quantity' } }. Portions: '1/1' (whole), '1/2' (left), '2/2' (right). Quantities: '0.5' (light), '1' (normal), '1.5' (extra), '2' (double). Example: { 'P': { '1/2': '1.5' } } for extra pepperoni on the left half."
            )
            .optional(),
          quantity: z
            .number()
            .int()
            .default(1)
            .describe("Number of this item to add"),
        })
        .describe("Item to add to the order"),
    },
    async (params) => {
      const result = await addItemToOrder(params, sessionManager);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Register removeItemFromOrder tool
  server.tool(
    "removeItemFromOrder", // Reverted name
    "Remove an item from an existing order",
    {
      orderId: z.string().describe("ID of the order to remove item from"),
      itemIndex: z
        .number()
        .int()
        .nonnegative()
        .describe(
          "Zero-based index of the item to remove from the order's list"
        ),
    },
    async (params) => {
      const result = await removeItemFromOrder(params, sessionManager);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Register getOrderState tool
  server.tool(
    "getOrderState", // Reverted name
    "Get the current state of an order from the session",
    {
      orderId: z.string().describe("ID of the order to retrieve state for"),
    },
    async (params) => {
      const result = await getOrderState(params, sessionManager);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Validate order tool
  server.tool(
    "validateOrder",
    "Validate an order before placing it",
    {
      orderId: z.string().describe("ID of the order to validate"),
    },
    async (params) => {
      const result = await validateOrder(params, sessionManager);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Price order tool
  server.tool(
    "priceOrder",
    "Price an order to get total cost",
    {
      orderId: z.string().describe("ID of the order to price"),
    },
    async (params) => {
      const result = await priceOrder(params, sessionManager);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Place order tool
  server.tool(
    "placeOrder",
    "Place an order with payment information",
    {
      orderId: z.string().describe("ID of the order to place"),
      payment: z
        .object({
          type: z.enum(["credit", "cash"]).describe("Payment method"),
          cardNumber: z.string().optional(),
          expiration: z.string().optional(),
          securityCode: z.string().optional(),
          postalCode: z
            .string()
            .describe("Billing postal code for credit card payments.")
            .optional(),
          tipAmount: z.number().optional(),
        })
        .describe("Payment information"),
    },
    async (params) => {
      const result = await placeOrder(params, sessionManager);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // Track order tool
  server.tool(
    "trackOrder",
    "Track the status of an order",
    {
      phoneNumber: z.string().describe("Phone number used for the order"),
      storeId: z.string().describe("ID of the store the order was placed at"),
      orderId: z.string().describe("Optional order ID if available").optional(),
    },
    async (params) => {
      const result = await trackOrder(params, sessionManager);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
