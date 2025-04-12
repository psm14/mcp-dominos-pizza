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

    // Access the raw menu data structure
    const menuData = menu.dominosAPIResponse;

    // Check if we have products to categorize
    if (menuData && menuData.Products) {
      // Group products by category
      const categorizedProducts = {};

      // Iterate through all products and categorize them
      Object.values(menuData.Products).forEach((product) => {
        const category = product.ProductType || "Other";
        if (!categorizedProducts[category]) {
          categorizedProducts[category] = [];
        }
        categorizedProducts[category].push(product);
      });

      // Add pizza category if available
      if (categorizedProducts.Pizza && categorizedProducts.Pizza.length > 0) {
        categories.push({
          name: "Pizzas",
          items: processMenuItems(categorizedProducts.Pizza, menuData),
        });
      }

      // Add sides category if available
      if (categorizedProducts.Sides && categorizedProducts.Sides.length > 0) {
        categories.push({
          name: "Sides",
          items: processMenuItems(categorizedProducts.Sides, menuData),
        });
      }

      // Add drinks category if available
      if (categorizedProducts.Drinks && categorizedProducts.Drinks.length > 0) {
        categories.push({
          name: "Drinks",
          items: processMenuItems(categorizedProducts.Drinks, menuData),
        });
      }

      // Add desserts category if available
      if (
        categorizedProducts.Desserts &&
        categorizedProducts.Desserts.length > 0
      ) {
        categories.push({
          name: "Desserts",
          items: processMenuItems(categorizedProducts.Desserts, menuData),
        });
      }
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
 * @param {Object} menuData - Full menu data object
 * @returns {Array} Processed menu items
 */
function processMenuItems(items, menuData) {
  return items.map((item) => {
    // Extract available toppings
    const options = {};

    if (item.AvailableToppings) {
      options.toppings = parseAvailableToppings(
        item.AvailableToppings,
        menuData
      );
    }

    if (item.AvailableSides) {
      options.sides = parseAvailableSides(item.AvailableSides, menuData);
    }

    // Return formatted item
    return {
      code: item.Code,
      name: item.Name,
      description: item.Description || "",
      basePrice: parseFloat(item.Price || "0"),
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
