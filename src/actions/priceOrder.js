/**
 * Price Order Action
 *
 * Gets pricing information for an order from the Domino's API
 */

/**
 * Handler for priceOrder action
 *
 * @param {Object} params - Action parameters
 * @param {Object} sessionManager - Session manager instance
 * @returns {Promise<Object>} Action result
 */
export async function priceOrder(params, sessionManager) {
  try {
    const { orderId } = params;

    // Get the order from the session
    const order = sessionManager.getOrder(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    try {
      // Price the order with Domino's API
      await order.price();

      // Extract pricing breakdown
      const pricing = {
        subTotal: order.amountsBreakdown?.menu || 0,
        tax: order.amountsBreakdown?.tax || 0,
        total: order.amountsBreakdown?.customer || 0,
      };

      // Add delivery fee if this is a delivery order
      if (order.serviceMethod === "Delivery") {
        pricing.delivery = order.amountsBreakdown?.surcharge || 0;
      }

      // Update the order in the session
      sessionManager.updateOrder(orderId, order);

      return {
        orderId,
        status: "priced",
        pricing,
      };
    } catch (error) {
      return {
        orderId,
        status: "pricing_failed",
        error: error.message,
      };
    }
  } catch (error) {
    throw new Error(`Failed to price order: ${error.message}`);
  }
}
