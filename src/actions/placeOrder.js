/**
 * Place Order Action
 *
 * Places an order with the Domino's API
 */

import { Payment } from "dominos";

/**
 * Handler for placeOrder action
 *
 * @param {Object} params - Action parameters
 * @param {Object} sessionManager - Session manager instance
 * @returns {Promise<Object>} Action result
 */
export async function placeOrder(params, sessionManager) {
  try {
    const { orderId, payment } = params;

    // Get the order from the session
    const order = sessionManager.getOrder(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Make sure the order has been priced
    if (!order.amountsBreakdown || !order.amountsBreakdown.customer) {
      throw new Error("Order must be priced before placing");
    }

    // Create the payment object
    const paymentData = {
      amount: order.amountsBreakdown.customer,
    };

    // Add credit card information if using credit payment
    if (payment.type === "credit") {
      if (!payment.cardNumber || !payment.expiration || !payment.securityCode) {
        throw new Error("Card details are required for credit payment");
      }

      paymentData.number = payment.cardNumber;
      paymentData.expiration = payment.expiration;
      paymentData.securityCode = payment.securityCode;
      paymentData.postalCode = payment.postalCode;
    }

    // Add tip amount if provided (delivery only)
    if (payment.tipAmount && order.serviceMethod === "Delivery") {
      paymentData.tipAmount = payment.tipAmount;
    }

    try {
      // Create the Domino's payment object
      const dominosPayment = new Payment(paymentData);

      // Add the payment to the order
      order.payments = [dominosPayment];

      // Place the order
      await order.place();

      // Extract order confirmation details
      const confirmation = {
        dominosOrderId: order.orderID,
        orderStatus: order.status,
      };

      // Add delivery or carryout specific information
      if (order.serviceMethod === "Delivery") {
        confirmation.estimatedDeliveryTime = order.estimatedWaitMinutes
          ? `${order.estimatedWaitMinutes}-${
              order.estimatedWaitMinutes + 10
            } minutes`
          : "Unknown";
      } else {
        confirmation.estimatedReadyTime = order.estimatedWaitMinutes
          ? new Date(
              Date.now() + order.estimatedWaitMinutes * 60000
            ).toLocaleTimeString()
          : "Unknown";
        confirmation.pickupLocation = order.storeAddress;
        confirmation.pickupInstructions =
          "Please bring your order confirmation and payment card for verification.";
      }

      // Update the order in the session
      sessionManager.updateOrder(orderId, order);

      return {
        orderId,
        status: "placed",
        orderType: order.serviceMethod === "Delivery" ? "delivery" : "carryout",
        confirmation,
      };
    } catch (error) {
      return {
        orderId,
        status: "placement_failed",
        error: error.message,
      };
    }
  } catch (error) {
    throw new Error(`Failed to place order: ${error.message}`);
  }
}
