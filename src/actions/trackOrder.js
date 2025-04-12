/**
 * Track Order Action
 *
 * Tracks the status of a Domino's order
 */

import { Tracking } from "dominos";

/**
 * Handler for trackOrder action
 *
 * @param {Object} params - Action parameters
 * @param {Object} sessionManager - Session manager instance
 * @returns {Promise<Object>} Action result
 */
export async function trackOrder(params, sessionManager) {
  try {
    const { phoneNumber, storeId, orderId } = params;

    // Format the phone number (remove non-numeric characters)
    const formattedPhone = phoneNumber.replace(/\D/g, "");

    // Create a new tracking instance
    const tracking = new Tracking();

    try {
      let trackingResult;

      if (orderId) {
        // If we have an order ID, track by that
        trackingResult = await tracking.byId(storeId, orderId);
      } else {
        // Otherwise track by phone number
        trackingResult = await tracking.byPhone(formattedPhone, storeId);
      }

      // If we didn't get any result, throw an error
      if (!trackingResult) {
        throw new Error("No tracking information found");
      }

      // Process the tracking information
      const orderStatus = trackingResult.OrderStatus || "Unknown";

      // Get estimated time based on status
      let estimatedTime = "Unknown";
      if (trackingResult.EstimatedDeliveryTime) {
        estimatedTime = trackingResult.EstimatedDeliveryTime;
      } else if (
        trackingResult.StatusItems &&
        trackingResult.StatusItems.length > 0
      ) {
        // Try to get estimated time from status items
        const timeItem = trackingResult.StatusItems.find(
          (item) =>
            item.Type.includes("Time") || item.Type.includes("Estimated")
        );
        if (timeItem) {
          estimatedTime = timeItem.Value;
        }
      }

      // Build tracker status object
      const tracker = {
        orderPlaced: true,
        preparation: orderStatus !== "Preparing" && orderStatus !== "Placed",
        baking:
          orderStatus !== "Preparing" &&
          orderStatus !== "Placed" &&
          orderStatus !== "Baking",
        qualityCheck:
          orderStatus !== "Preparing" &&
          orderStatus !== "Placed" &&
          orderStatus !== "Baking" &&
          orderStatus !== "Quality Check",
      };

      // Add delivery or carryout specific status
      if (trackingResult.ServiceMethod === "Delivery") {
        tracker.outForDelivery =
          orderStatus === "Out for Delivery" || orderStatus === "Complete";
        tracker.delivered = orderStatus === "Complete";

        estimatedTime =
          orderStatus === "Out for Delivery" ? "5-15 minutes" : estimatedTime;
      } else {
        tracker.readyForPickup =
          orderStatus === "Ready for Pickup" || orderStatus === "Complete";
        tracker.pickedUp = orderStatus === "Complete";

        estimatedTime =
          orderStatus === "Ready for Pickup" ? "Ready now" : estimatedTime;
      }

      // Get order details
      const orderDetails = {
        items: trackingResult.OrderDescription
          ? trackingResult.OrderDescription.split(",")
          : ["Order items not available"],
        placedAt: trackingResult.PlacedTime || new Date().toISOString(),
      };

      // Build response based on service method
      const response = {
        status: orderStatus,
        estimatedDeliveryTime: estimatedTime,
        orderDetails,
        tracker,
      };

      // Add pickup location for carryout orders
      if (trackingResult.ServiceMethod !== "Delivery") {
        response.estimatedReadyTime = estimatedTime;
        delete response.estimatedDeliveryTime;

        if (trackingResult.StoreName && trackingResult.StoreAddress) {
          response.pickupLocation = `${trackingResult.StoreName}, ${trackingResult.StoreAddress}`;
        }
      }

      return response;
    } catch (error) {
      return {
        status: "tracking_failed",
        error: error.message,
      };
    }
  } catch (error) {
    throw new Error(`Failed to track order: ${error.message}`);
  }
}
