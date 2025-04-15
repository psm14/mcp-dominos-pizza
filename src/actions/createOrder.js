/**
 * Create Order Action
 *
 * Creates a new Domino's Pizza order
 */

import { Customer, Order, Address } from "dominos";

/**
 * Handler for createOrder action
 *
 * @param {Object} params - Action parameters
 * @param {Object} sessionManager - Session manager instance
 * @returns {Promise<Object>} Action result
 */
export async function createOrder(params, sessionManager) {
  try {
    const { storeId, customer, address, orderType = "delivery" } = params;

    if (!address) {
      throw new Error("Address is required even for carry out orders");
    }

    // Create the customer object
    const customerData = {
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
      email: customer.email || undefined,
    };

    const dominosCustomer = new Customer(customerData);

    // Create a new order
    const order = new Order(dominosCustomer);

    order.address = new Address(address);

    // Set the store ID
    order.storeID = storeId;

    // Set the service method based on order type
    order.serviceMethod = orderType === "delivery" ? "Delivery" : "Carryout";

    // Save the order in the session
    const { orderId } = sessionManager.createOrder(order);

    // Get the selected store for additional information
    const store = sessionManager.selectStore(storeId);

    // Return the order information
    return {
      orderId,
      status: "created",
      orderType,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        ...(customer.address && { address: customer.address }),
      },
      ...(store && {
        store: {
          storeId: store.StoreID,
          address: store.AddressDescription,
        },
      }),
    };
  } catch (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }
}
