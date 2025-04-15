/**
 * Remove Item From Order Action
 *
 * Removes an item from an existing order based on its index.
 */

import { Item } from "dominos"; // Assuming Item class might be needed, though maybe not directly

/**
 * Handler for removeItemFromOrder action
 *
 * @param {Object} params - Action parameters
 * @param {string} params.orderId - The ID of the order to modify.
 * @param {number} params.itemIndex - The zero-based index of the item to remove from the order's item list.
 * @param {Object} sessionManager - Session manager instance
 * @returns {Promise<Object>} Action result indicating success or failure
 */
export async function removeItemFromOrder(params, sessionManager) {
  try {
    const { orderId, itemIndex } = params;

    if (typeof itemIndex !== "number" || itemIndex < 0) {
      throw new Error(
        "Invalid itemIndex provided. Must be a non-negative number."
      );
    }

    // Retrieve the order from the session
    const order = sessionManager.getOrder(orderId);
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found in session.`);
    }

    // Check if the item index is valid for the current order items
    if (itemIndex >= order.products.length) {
      throw new Error(
        `Invalid itemIndex ${itemIndex}. Order only has ${order.products.length} items.`
      );
    }

    // Get the specific Item instance to remove
    const itemToRemove = order.products[itemIndex];

    // Use the library's removeItem method
    // Note: The documentation states it takes an Item instance.
    order.removeItem(itemToRemove);

    // Update the order in the session (optional, depends if sessionManager stores mutable objects)
    // sessionManager.updateOrder(orderId, order); // Assuming such a method exists or is needed

    console.log(`Removed item at index ${itemIndex} from order ${orderId}`);

    // Return the updated order status (or just a success message)
    return {
      orderId: orderId,
      status: "item_removed",
      remainingItemsCount: order.products.length,
      // Optionally return the updated list of items
      // items: order.products.map(item => ({ code: item.code, name: item.code, options: item.options, quantity: item.qty })) // Map to a serializable format
    };
  } catch (error) {
    console.error(`Error removing item from order: ${error.message}`);
    // It's often better to let the MCP framework handle generic errors
    // but we can return a structured error if needed by the client.
    return {
      orderId: params.orderId,
      status: "error_removing_item",
      error: error.message,
    };
    // Or rethrow:
    // throw new Error(`Failed to remove item from order ${params.orderId}: ${error.message}`);
  }
}
