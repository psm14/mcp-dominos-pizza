/**
 * Get Order State Action
 *
 * Retrieves the current state of an order from the session.
 */

/**
 * Handler for getOrderState action
 *
 * @param {Object} params - Action parameters
 * @param {string} params.orderId - The ID of the order to retrieve.
 * @param {Object} sessionManager - Session manager instance
 * @returns {Promise<Object>} Action result containing the order state
 */
export async function getOrderState(params, sessionManager) {
  try {
    const { orderId } = params;

    // Retrieve the order from the session
    const order = sessionManager.getOrder(orderId);
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found in session.`);
    }

    // Extract relevant information into a serializable format
    const orderState = {
      orderId: order.orderID, // Assuming order object has orderID property
      storeId: order.storeID,
      serviceMethod: order.serviceMethod, // e.g., 'Carryout' or 'Delivery'
      customer: {
        firstName: order.firstName,
        lastName: order.lastName,
        email: order.email,
        phone: order.phone,
      },
      address: order.address,
      items: order.products.map((item, index) => ({
        index: index, // Add index for easy reference (e.g., for removal)
        code: item.code,
        name: item.code, // Use code as name for now, could be enhanced if Item class stores name
        options: item.options,
        quantity: item.qty,
      })),
      // Add other relevant fields if needed, e.g., price if already priced
      // price: order.amounts?.Customer || null,
      // status: order.status // If the order object tracks status
    };

    return orderState;
  } catch (error) {
    console.error(`Error getting order state: ${error.message}`);
    // Rethrow or return a structured error
    throw new Error(
      `Failed to get state for order ${params.orderId}: ${error.message}`
    );
  }
}
