/**
 * Get Menu Action
 *
 * Retrieves the menu for a specific Domino's store
 */

import { Menu } from "dominos";

/**
 * Handler for getMenu action
 *
 * @param {Object} params - Action parameters
 * @param {Object} sessionManager - Session manager instance
 * @returns {Promise<Object>} Action result
 */
export async function getMenu(params, sessionManager) {
  try {
    const { storeId } = params;

    // Select the store in the session
    sessionManager.selectStore(storeId);

    // Fetch the menu for the store
    const menu = await new Menu(storeId);

    // Save the raw menu data in the session for later use
    sessionManager.setMenu(menu);

    // Process menu categories for easier browsing
    const categories = [];

    // Process pizzas
    const pizzas = menu.getFoodCategory("Pizza");
    if (pizzas && pizzas.length > 0) {
      categories.push({
        name: "Pizzas",
        items: processMenuItems(pizzas, menu),
      });
    }

    // Process sides
    const sides = menu.getFoodCategory("Sides");
    if (sides && sides.length > 0) {
      categories.push({
        name: "Sides",
        items: processMenuItems(sides, menu),
      });
    }

    // Process drinks
    const drinks = menu.getFoodCategory("Drinks");
    if (drinks && drinks.length > 0) {
      categories.push({
        name: "Drinks",
        items: processMenuItems(drinks, menu),
      });
    }

    // Process desserts
    const desserts = menu.getFoodCategory("Dessert");
    if (desserts && desserts.length > 0) {
      categories.push({
        name: "Desserts",
        items: processMenuItems(desserts, menu),
      });
    }

    // Return the processed menu data
    return {
      categories,
      toppingCodes: {
        mapping:
          "See 'Topping and Option Codes' section for details on how to use these codes when adding items to an order",
      },
    };
  } catch (error) {
    throw new Error(`Failed to get menu: ${error.message}`);
  }
}

/**
 * Process menu items to extract relevant information
 *
 * @param {Array} items - Menu items
 * @param {Object} menu - Full menu object
 * @returns {Array} Processed menu items
 */
function processMenuItems(items, menu) {
  return items.map((item) => {
    // Extract available toppings
    const options = {};

    if (item.AvailableToppings) {
      options.toppings = parseAvailableToppings(item.AvailableToppings, menu);
    }

    if (item.AvailableSides) {
      options.sides = parseAvailableSides(item.AvailableSides, menu);
    }

    // Return formatted item
    return {
      code: item.Code,
      name: item.Name,
      description: item.Description || "",
      basePrice: parseFloat(item.Price),
      options,
    };
  });
}

/**
 * Parse available toppings string into structured data
 *
 * @param {String} toppingsString - Available toppings string
 * @param {Object} menu - Full menu object
 * @returns {Array} Structured toppings data
 */
function parseAvailableToppings(toppingsString, menu) {
  const toppings = [];

  // Split the toppings string by comma
  const toppingCodes = toppingsString.split(",");

  // Process each topping code
  toppingCodes.forEach((codeWithQuantities) => {
    // Split by equals to get code and allowed quantities
    const [code, quantities] = codeWithQuantities.split("=");

    // Try to find this topping in the menu
    const toppingInfo = menu.Toppings?.[code] || { Name: code };

    // Parse allowed quantities if available
    const allowedQuantities = quantities ? quantities.split(":") : ["0", "1"];

    toppings.push({
      name: toppingInfo.Name,
      code,
      allowedQuantities,
    });
  });

  return toppings;
}

/**
 * Parse available sides string into structured data
 *
 * @param {String} sidesString - Available sides string
 * @param {Object} menu - Full menu object
 * @returns {Array} Structured sides data
 */
function parseAvailableSides(sidesString, menu) {
  // This is a simplified version - the actual implementation would need to
  // parse the sides string format which may be different from toppings
  const sides = [];

  // Split the sides string by comma
  const sideCodes = sidesString.split(",");

  // Process each side code
  sideCodes.forEach((code) => {
    // Try to find this side in the menu
    const sideInfo = menu.Sides?.[code] || { Name: code };

    sides.push({
      name: sideInfo.Name,
      code,
    });
  });

  return sides;
}
