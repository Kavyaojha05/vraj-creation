const Product = require("../models/Product");

// =====================================================
// VERIFY PRODUCTS FOR WEBSITE ORDER
// INTERNAL ONLY
// =====================================================
//
// Used by:
// Vraj Creation Public Website Backend
//
// Authentication:
// internalStockMiddleware
//
// IMPORTANT:
// Frontend price is NEVER trusted.
// Actual sellingPrice comes from Dashboard MongoDB.
// =====================================================

const verifyProducts = async (req, res) => {
  try {
    const { items } = req.body;

    // =================================================
    // VALIDATE ITEMS
    // =================================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Product items are required.",
      });
    }

    // =================================================
    // NORMALIZE ITEMS
    // =================================================

    const normalizedItems = items.map((item) => ({
      productId: String(item?.productId || "").trim(),
      quantity: Number(item?.quantity),
    }));

    // =================================================
    // VALIDATE EACH ITEM
    // =================================================

    for (const item of normalizedItems) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          message: "Product ID is required.",
        });
      }

      if (
        !Number.isInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid quantity for product ${item.productId}.`,
        });
      }
    }

    // =================================================
    // FIND PRODUCTS
    // =================================================

    const productIds = normalizedItems.map(
      (item) => item.productId
    );

    const products = await Product.find({
      _id: {
        $in: productIds,
      },
    }).lean();

    // =================================================
    // CREATE PRODUCT MAP
    // =================================================

    const productMap = new Map();

    for (const product of products) {
      productMap.set(
        String(product._id),
        product
      );
    }

    // =================================================
    // VERIFY PRODUCTS
    // =================================================

    const verifiedProducts = [];

    for (const item of normalizedItems) {
      const product =
        productMap.get(item.productId);

      // -------------------------------------------------
      // PRODUCT NOT FOUND
      // -------------------------------------------------

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            `Product not found: ${item.productId}`,
        });
      }

      // -------------------------------------------------
      // PRODUCT STATUS
      // -------------------------------------------------

      if (
        product.status &&
        String(product.status).toLowerCase() !==
          "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Product is currently unavailable: ${product.name}`,
        });
      }

      // -------------------------------------------------
      // SELLING PRICE
      // -------------------------------------------------

      const sellingPrice =
        Number(product.sellingPrice);

      if (
        !Number.isFinite(sellingPrice) ||
        sellingPrice < 0
      ) {
        return res.status(500).json({
          success: false,
          message:
            `Invalid selling price for product: ${product.name}`,
        });
      }

      // -------------------------------------------------
      // STOCK CHECK
      // -------------------------------------------------

      const stock =
        Number(product.stock);

      if (
        !Number.isFinite(stock) ||
        stock < 0
      ) {
        return res.status(500).json({
          success: false,
          message:
            `Invalid stock value for product: ${product.name}`,
        });
      }

      if (stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message:
            `Insufficient stock for product: ${product.name}`,
          availableStock: stock,
          requestedQuantity: item.quantity,
        });
      }

      // =================================================
      // RETURN TRUSTED PRODUCT DATA
      // =================================================

      verifiedProducts.push({
        productId: String(product._id),

        sku:
          product.sku || "",

        name:
          product.name || "",

        category:
          product.category || "",

        subcategory:
          product.subcategory || "",

        image:
          product.image || "",

        description:
          product.description || "",

        size:
          product.size || "",

        price:
          sellingPrice,

        stock,
      });
    }

    // =================================================
    // SUCCESS
    // =================================================

    return res.json({
      success: true,

      message:
        "Products verified successfully.",

      products: verifiedProducts,
    });
  } catch (error) {
    console.error(
      "VERIFY PRODUCTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify products.",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  verifyProducts,
};