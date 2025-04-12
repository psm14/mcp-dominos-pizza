/**
 * Find Nearby Stores Action
 *
 * Finds Domino's stores near an address
 */

import { Address, NearbyStores } from "dominos";

/**
 * Handler for findNearbyStores action
 *
 * @param {Object} params - Action parameters
 * @param {Object} sessionManager - Session manager instance
 * @returns {Promise<Object>} Action result
 */
export async function findNearbyStores(params, sessionManager) {
  try {
    const { address } = params;

    // Create a Domino's Address object from the address string
    const customerAddress = new Address(address);

    // Find stores near the address using the Domino's API
    const nearbyStoresResult = await new NearbyStores(customerAddress);

    // Filter for online-capable, open stores
    const filteredStores = nearbyStoresResult.stores
      .filter((store) => store.IsOnlineCapable && store.IsOpen)
      .map((store) => ({
        storeID: store.StoreID,
        address: `${store.AddressDescription}`,
        phone: store.Phone,
        isOpen: store.IsOpen,
        allowsDelivery: store.ServiceIsOpen.Delivery,
        allowsCarryout: store.ServiceIsOpen.Carryout,
        estimatedDeliveryTime: store.ServiceMethodEstimatedWaitMinutes?.Delivery
          ? `${store.ServiceMethodEstimatedWaitMinutes.Delivery.Min}-${store.ServiceMethodEstimatedWaitMinutes.Delivery.Max} min`
          : "Unknown",
        estimatedCarryoutTime: store.ServiceMethodEstimatedWaitMinutes?.Carryout
          ? `${store.ServiceMethodEstimatedWaitMinutes.Carryout.Min}-${store.ServiceMethodEstimatedWaitMinutes.Carryout.Max} min`
          : "Unknown",
        ...(store.MinDistance !== undefined
          ? { distance: `${store.MinDistance.toFixed(1)} miles` }
          : {}),
      }))
      .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    // Save the raw stores data in the session for later use
    sessionManager.setStores(nearbyStoresResult.stores);

    return {
      stores: filteredStores,
    };
  } catch (error) {
    throw new Error(`Failed to find nearby stores: ${error.message}`);
  }
}
