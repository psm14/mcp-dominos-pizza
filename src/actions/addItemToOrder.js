/**
 * Add Item to Order Action
 *
 * Adds an item to an existing Domino's Pizza order
 */

import { Item } from "dominos";

/**
 * Handler for addItemToOrder action
 *
 * @param {Object} params - Action parameters
 * @param {Object} sessionManager - Session manager instance
 * @returns {Promise<Object>} Action result
 */
export async function addItemToOrder(params, sessionManager) {
  try {
    const { orderId, item } = params;

    // Get the order from the session
    const order = sessionManager.getOrder(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Create the item using the Domino's API
    const dominosItem = new Item({
      code: item.code,
      options: item.options || {},
      quantity: item.quantity || 1,
    });

    // Add the item to the order
    order.addItem(dominosItem);

    // Update the order in the session
    sessionManager.updateOrder(orderId, order);

    // Format the items for display
    const formattedItems = order.products.map((product) => ({
      code: product.code,
      name: product.name || product.code,
      options: product.options || {},
      quantity: product.qty || 1,
    }));

    return {
      orderId,
      status: "updated",
      items: formattedItems,
    };
  } catch (error) {
    throw new Error(`Failed to add item to order: ${error.message}`);
  }
}
