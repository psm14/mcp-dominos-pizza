/**
 * Session Manager
 *
 * Manages state for the MCP server, keeping track of stores, orders, and customer data
 * between action calls.
 */

import { v4 as uuidv4 } from "uuid";

/**
 * Creates a session manager to maintain state across action calls
 *
 * @returns {Object} Session manager object
 */
export function createSessionManager() {
  // In-memory state storage
  const state = {
    stores: [],
    selectedStore: null,
    menu: null,
    orders: {},
    customers: {},
  };

  /**
   * Get the current state
   *
   * @returns {Object} Current session state
   */
  function getState() {
    return state;
  }

  /**
   * Store nearby stores information
   *
   * @param {Array} stores - Array of store objects
   */
  function setStores(stores) {
    state.stores = stores;
    return state.stores;
  }

  /**
   * Select a store by ID
   *
   * @param {String} storeId - ID of the store to select
   * @returns {Object|null} The selected store or null if not found
   */
  function selectStore(storeId) {
    const store = state.stores.find((store) => store.StoreID === storeId);
    if (store) {
      state.selectedStore = store;
    }
    return state.selectedStore;
  }

  /**
   * Set the menu for the selected store
   *
   * @param {Object} menu - Menu object from the Domino's API
   */
  function setMenu(menu) {
    state.menu = menu;
    return state.menu;
  }

  /**
   * Save a customer
   *
   * @param {String} customerId - Unique ID for the customer
   * @param {Object} customer - Customer object
   */
  function saveCustomer(customer) {
    const customerId = uuidv4();
    state.customers[customerId] = customer;
    return { customerId, customer };
  }

  /**
   * Get a customer by ID
   *
   * @param {String} customerId - ID of the customer to retrieve
   * @returns {Object|null} The customer object or null if not found
   */
  function getCustomer(customerId) {
    return state.customers[customerId] || null;
  }

  /**
   * Create a new order
   *
   * @param {Object} order - Order object
   * @returns {Object} Order ID and order object
   */
  function createOrder(order) {
    const orderId = uuidv4();
    state.orders[orderId] = order;
    return { orderId, order };
  }

  /**
   * Get an order by ID
   *
   * @param {String} orderId - ID of the order to retrieve
   * @returns {Object|null} The order object or null if not found
   */
  function getOrder(orderId) {
    return state.orders[orderId] || null;
  }

  /**
   * Update an existing order
   *
   * @param {String} orderId - ID of the order to update
   * @param {Object} order - Updated order object
   * @returns {Object|null} The updated order or null if not found
   */
  function updateOrder(orderId, order) {
    if (state.orders[orderId]) {
      state.orders[orderId] = order;
      return state.orders[orderId];
    }
    return null;
  }

  return {
    getState,
    setStores,
    selectStore,
    setMenu,
    saveCustomer,
    getCustomer,
    createOrder,
    getOrder,
    updateOrder,
  };
}
