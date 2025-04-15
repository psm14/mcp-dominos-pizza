/**
 * Get Menu Action
 *
 * Retrieves the menu for a specific Domino's store
 */

import { Menu } from "dominos";
// Removed unused fs/path/url imports

// --- Simplified Helper Functions ---

/**
 * Generates the sharedOptions object mapping API codes to human-readable names.
 * Relies directly on Toppings data without complex type inference.
 * @param {Object} menuData - Raw menu data from Dominos API.
 * @returns {Object} The sharedOptions structure.
 */
function generateSharedOptions(menuData) {
  const sharedOptions = {};

  // Helper to parse a topping category
  const parseToppingCategory = (categoryKey, description) => {
    const toppings = menuData?.Toppings?.[categoryKey];
    if (!toppings) return null;

    const codes = {};
    Object.entries(toppings).forEach(([code, details]) => {
      // Use name directly if available as a string
      if (details && typeof details.Name === "string") {
        codes[code] = { name: details.Name };
      }
      // Fallback for cases where Name might be missing or different structure
      else if (
        typeof details === "object" &&
        details !== null &&
        Object.keys(details).length > 0
      ) {
        // Attempt to find a name-like property, or use the code itself as a fallback name
        const potentialName = details.Name || details.name || code;
        codes[code] = { name: potentialName };
      } else if (typeof details === "string") {
        // If the detail itself is just a string name
        codes[code] = { name: details };
      }
    });

    if (Object.keys(codes).length === 0) return null;
    return { description, codes };
  };

  // Define shared option sets using the simplified helper
  sharedOptions.pizzaToppings = parseToppingCategory(
    "Pizza",
    "Standard pizza toppings. Use codes with portions (1/1=whole, 1/2=left, 2/2=right) and quantities (0=none, 0.5=light, 1=normal, 1.5=extra, 2=double). Example: {'P': {'1/2': '1.5'}} for extra pepperoni on the left half."
  );
  sharedOptions.dippingSauces = parseToppingCategory(
    "Bread", // Dipping sauces often listed under Bread toppings
    "Dipping sauces available for sides."
  );
  // Consider adding other relevant topping categories if needed (e.g., Wings, Sandwich)
  // sharedOptions.wingSauces = parseToppingCategory("Wings", "Sauces for wings.");
  // sharedOptions.sandwichToppings = parseToppingCategory("Sandwich", "Options for sandwiches.");

  // Filter out null entries
  Object.keys(sharedOptions).forEach((key) => {
    if (sharedOptions[key] === null) {
      delete sharedOptions[key];
    }
  });

  return sharedOptions;
}

// --- Removed extractSize and extractFlavorOrCrust ---

/**
 * Determines the appropriate sharedOptions key reference based on product type.
 * @param {string} productType - Product type (e.g., 'Pizza', 'Bread').
 * @returns {string|null} Key from sharedOptions or null.
 */
function getOptionsRef(productType) {
  if (productType === "Pizza") return "pizzaToppings";
  if (
    ["Bread", "Wings", "Tots", "GSalad", "DipSauce", "BreadDipCombos"].includes(
      productType
    ) // Expanded list for sides
  )
    return "dippingSauces";
  // Add more mappings if other option types are defined in sharedOptions
  // if (productType === "Wings") return "wingSauces";
  // if (productType === "Sandwich") return "sandwichToppings";
  return null;
}

/**
 * Processes products within a category to create the aggregated item structure.
 * Simplified logic: Uses product name as base, includes variant name directly.
 * @param {string} categoryName - Name of the category being processed.
 * @param {Array} products - Array of product objects for this category.
 * @param {Object} menuData - Full raw menu data.
 * @param {Object} sharedOptions - Generated shared options.
 * @returns {Array} Array of aggregated items with variants.
 */
function processCategory(categoryName, products, menuData, sharedOptions) {
  const aggregatedItems = {}; // Use object for easy grouping by product Code/Name

  if (!menuData || !menuData.Variants) {
    console.error(
      "Cannot process category: menuData or menuData.Variants is missing."
    );
    return [];
  }

  products.forEach((product) => {
    // Use Product Name as the primary grouping key, fallback to Code if Name is missing
    const baseItemName = product.Name || product.Code;
    if (!baseItemName || product.ProductType === "Generic") {
      return; // Skip products without a name/code or generic ones
    }
    const baseDescription = product.Description || "";
    const productType = product.ProductType || "Other";

    // Ensure the base item entry exists
    if (!aggregatedItems[baseItemName]) {
      aggregatedItems[baseItemName] = {
        name: baseItemName,
        description: baseDescription,
        productCode: product.Code, // Store the original product code for reference
        variants: [],
      };
    }

    const productVariants = product.Variants || [];

    if (productVariants.length > 0) {
      // Process actual variants
      productVariants.forEach((variantCode) => {
        const variantDetails = menuData.Variants[variantCode];
        if (variantDetails) {
          const variant = {
            code: variantDetails.Code || variantCode,
            name: variantDetails.Name || variantCode, // Use variant name directly
            description: variantDetails.Description || "",
            // basePrice: parseFloat(variantDetails.Price || "0"), // Price might be unreliable
            availableOptionsRef: getOptionsRef(productType),
          };

          // Clean up null/empty values in the variant object
          Object.keys(variant).forEach((key) => {
            if (variant[key] === null || variant[key] === "") {
              delete variant[key];
            }
          });
          // Avoid adding duplicate variants if API lists them multiple times
          if (
            !aggregatedItems[baseItemName].variants.some(
              (v) => v.code === variant.code
            )
          ) {
            aggregatedItems[baseItemName].variants.push(variant);
          }
        } else if (process.env.DEBUG) {
          console.warn(
            `Variant ${variantCode} for product ${product.Code} (${baseItemName}) not found in menuData.Variants`
          );
        }
      });
    } else if (product.Code && product.Name) {
      // Handle products with NO variants (treat product as a single variant item)
      const variant = {
        code: product.Code,
        name: product.Name, // Use product name as variant name
        description: product.Description || "",
        //  basePrice: parseFloat(product.Price || "0"), // Price might be unreliable
        availableOptionsRef: getOptionsRef(productType),
      };
      // Clean up null/empty values
      Object.keys(variant).forEach((key) => {
        if (variant[key] === null || variant[key] === "") delete variant[key];
      });
      // Avoid adding duplicate variants if API lists them multiple times
      if (
        !aggregatedItems[baseItemName].variants.some(
          (v) => v.code === variant.code
        )
      ) {
        aggregatedItems[baseItemName].variants.push(variant);
      }
    }

    // If after processing, an item has no variants, remove it (handles cases where variants were invalid)
    if (aggregatedItems[baseItemName].variants.length === 0) {
      delete aggregatedItems[baseItemName];
    }
  });

  // Convert the aggregatedItems object to an array and sort by name
  const finalItems = Object.values(aggregatedItems);
  finalItems.sort((a, b) => a.name.localeCompare(b.name));

  // Sort variants within each item by code (optional but helps consistency)
  finalItems.forEach((item) => {
    item.variants.sort((va, vb) => {
      return (va.code || "").localeCompare(vb.code || "");
    });
  });

  return finalItems;
}

// --- Main Action Handler (largely unchanged, but uses simplified helpers) ---

/**
 * Handler for getMenu action
 *
 * @param {Object} params - Action parameters ({ storeId })
 * @param {Object} sessionManager - Session manager instance
 * @returns {Promise<Object>} Action result in the simplified structured format
 */
export async function getMenu(params, sessionManager) {
  try {
    const { storeId } = params;

    // Select the store in the session
    sessionManager.selectStore(storeId);

    // Fetch the menu for the store
    const menu = await new Menu(storeId);

    // Save the raw menu data in the session for later use (optional)
    sessionManager.setMenu(menu);

    // Access the raw menu data structure
    const menuData = menu.dominosAPIResponse;

    if (
      !menuData ||
      !menuData.Products ||
      !menuData.Variants ||
      !menuData.Toppings
    ) {
      // Attempt to check specific store status if available
      if (menuData?.Misc?.Status === -1 && menuData?.Misc?.StatusItem) {
        throw new Error(
          `Failed to get menu: Store status indicates an issue - ${JSON.stringify(
            menuData.Misc.StatusItem
          )}`
        );
      }
      throw new Error(
        "Incomplete menu data received from API. The store might be closed or the API response is malformed."
      );
    }

    // --- Generate New Menu Structure ---

    // 1. Generate Shared Options (Simplified)
    const sharedOptions = generateSharedOptions(menuData);

    // 2. Categorize Products (Using refined/consolidated categories)
    const categorizedProducts = {};
    Object.values(menuData.Products).forEach((product) => {
      let categoryName = product.ProductType || "Other";

      // Refine and consolidate category names
      if (categoryName === "Pizza") categoryName = "Pizzas";
      else if (categoryName === "Pasta") categoryName = "Pastas";
      else if (categoryName === "Sandwich") categoryName = "Sandwiches";
      else if (categoryName === "Dessert") categoryName = "Desserts";
      else if (categoryName === "Drinks") categoryName = "Drinks";
      else if (
        [
          "Bread",
          "BreadDipCombos",
          "Wings",
          "Tots",
          "GSalad", // Garden Salad
          "DipSauce", // Individual Dipping Sauces
        ].includes(categoryName)
      )
        categoryName = "Sides"; // Consolidate sides
      else if (categoryName === "Generic" || !product.Name)
        return; // Skip generic internal products or those without names
      else categoryName = "Other"; // Catch-all for less common types

      if (!categorizedProducts[categoryName]) {
        categorizedProducts[categoryName] = [];
      }
      categorizedProducts[categoryName].push(product);
    });

    // 3. Process Categories into the new structure (Simplified)
    const categories = [];
    const categoryOrder = [
      "Pizzas",
      "Pastas",
      "Sandwiches",
      "Sides",
      "Drinks",
      "Desserts",
      "Other",
    ];

    categoryOrder.forEach((categoryName) => {
      const productsInCategory = categorizedProducts[categoryName];
      if (productsInCategory && productsInCategory.length > 0) {
        const items = processCategory(
          categoryName,
          productsInCategory,
          menuData,
          sharedOptions
        );
        if (items.length > 0) {
          categories.push({
            name: categoryName,
            items: items,
          });
        }
      }
    });

    // 4. Return the final structured menu
    return {
      storeId: menuData.Misc?.StoreID || storeId, // Include storeId
      menu: {
        categories,
      },
      sharedOptions, // Include the generated shared options
    };
  } catch (error) {
    console.error("Error in getMenu:", error);
    const message =
      error.message ||
      "An unknown error occurred while fetching or processing the menu.";
    // Check for specific Dominos API errors if available
    if (error.dominosErrors?.length > 0) {
      throw new Error(
        `Failed to get menu: ${error.dominosErrors[0].message || message}`
      );
    }
    // Rethrow with a potentially more informative message
    throw new Error(
      message.startsWith("Failed to get menu:")
        ? message
        : `Failed to get menu: ${message}`
    );
  }
}

// --- Old/Unused Functions Removed ---
// The old complex processMenuItems and parseAvailableToppings are no longer needed.
// Removed extractSize and extractFlavorOrCrust.
