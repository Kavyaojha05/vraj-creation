// =====================================================
// VRAJ CREATION DASHBOARD
// INTERNAL STOCK CONTROLLER
//
// Secure + Atomic + Idempotent Stock Operations
//
// Supported:
//   POST /api/internal/stock/decrease
//   POST /api/internal/stock/increase
//
// decrease:
//   operationId required
//
// rollback/increase:
//   operationId = original decrease operationId
//
// Same operation retry:
//   Stock will NOT change twice.
// =====================================================

const mongoose = require("mongoose");

const Product = require("../models/Product");

const StockOperation =
  require("../models/StockOperation");

// =====================================================
// HELPERS
// =====================================================

const isValidObjectId = (
  value
) => {
  return mongoose.Types.ObjectId.isValid(
    String(value || "").trim()
  );
};

// =====================================================
// PRODUCT FILTER
// =====================================================
//
// productId can be:
//   1. MongoDB ObjectId
//   2. SKU
//
// =====================================================

const findProductFilter = (
  productId
) => {
  const value =
    String(productId || "").trim();

  if (!value) {
    return null;
  }

  if (isValidObjectId(value)) {
    return {
      _id: value,
    };
  }

  return {
    sku: value.toUpperCase(),
  };
};

// =====================================================
// NORMALIZE ITEMS
// =====================================================
//
// Duplicate product IDs are combined.
//
// Example:
//
// VRJ100 x 2
// VRJ100 x 3
//
// becomes:
//
// VRJ100 x 5
//
// =====================================================

const normalizeItems = (
  items
) => {
  if (!Array.isArray(items)) {
    throw new Error(
      "items must be an array."
    );
  }

  if (!items.length) {
    throw new Error(
      "At least one stock item is required."
    );
  }

  const map = new Map();

  for (
    const item of items
  ) {
    if (!item || typeof item !== "object") {
      throw new Error(
        "Invalid stock item."
      );
    }

    const productId =
      String(
        item.productId || ""
      ).trim();

    const quantity =
      Number(
        item.quantity
      );

    if (!productId) {
      throw new Error(
        "Product ID is required."
      );
    }

    if (
      !Number.isInteger(
        quantity
      ) ||
      quantity <= 0
    ) {
      throw new Error(
        `Invalid quantity for product ${productId}.`
      );
    }

    if (
      !findProductFilter(
        productId
      )
    ) {
      throw new Error(
        `Invalid product ID: ${productId}`
      );
    }

    const existing =
      map.get(
        productId.toUpperCase()
      );

    if (existing) {
      existing.quantity +=
        quantity;
    } else {
      map.set(
        productId.toUpperCase(),
        {
          productId,
          quantity,
        }
      );
    }
  }

  return Array.from(
    map.values()
  );
};

// =====================================================
// FIND PRODUCT
// =====================================================

const getProduct =
  async (
    productId
  ) => {
    const filter =
      findProductFilter(
        productId
      );

    if (!filter) {
      return null;
    }

    return Product.findOne(
      filter
    );
  };

// =====================================================
// DECREASE STOCK
// =====================================================

const decreaseStock =
  async (
    req,
    res
  ) => {
    let operation = null;

    try {
      // =================================================
      // OPERATION ID
      // =================================================

      const operationId =
        String(
          req.body?.operationId ||
            ""
        ).trim();

      if (!operationId) {
        return res.status(400).json({
          success: false,
          message:
            "operationId is required.",
        });
      }

      // =================================================
      // IDEMPOTENCY CHECK
      // =================================================

      const existing =
        await StockOperation.findOne({
          operationId,
        });

      if (existing) {
        // -----------------------------------------------
        // COMPLETED
        // -----------------------------------------------

        if (
          existing.status ===
          "completed"
        ) {
          return res.status(200).json({
            success: true,

            alreadyProcessed:
              true,

            operationId,

            message:
              "Stock decrease already processed.",

            products:
              existing.products,
          });
        }

        // -----------------------------------------------
        // PROCESSING
        // -----------------------------------------------

        if (
          existing.status ===
          "processing"
        ) {
          return res.status(409).json({
            success: false,

            alreadyProcessed:
              false,

            processing: true,

            operationId,

            message:
              "This stock operation is already being processed.",
          });
        }

        // -----------------------------------------------
        // FAILED
        // -----------------------------------------------

        return res.status(409).json({
          success: false,

          operationId,

          message:
            "This stock operation previously failed. Use a new operationId.",
        });
      }

      // =================================================
      // NORMALIZE ITEMS
      // =================================================

      const items =
        normalizeItems(
          req.body?.items
        );

      // =================================================
      // CREATE OPERATION
      // =================================================

      try {
        operation =
          await StockOperation.create(
            {
              operationId,

              type:
                "decrease",

              status:
                "processing",

              items,
            }
          );
      } catch (error) {
        // -----------------------------------------------
        // UNIQUE OPERATION RACE
        // -----------------------------------------------

        if (
          error?.code === 11000
        ) {
          const raced =
            await StockOperation.findOne(
              {
                operationId,
              }
            );

          if (
            raced?.status ===
            "completed"
          ) {
            return res.status(200).json({
              success: true,

              alreadyProcessed:
                true,

              operationId,

              message:
                "Stock decrease already processed.",

              products:
                raced.products,
            });
          }

          return res.status(409).json({
            success: false,

            operationId,

            message:
              "This stock operation is already being processed.",
          });
        }

        throw error;
      }

      // =================================================
      // PRE-VALIDATE ALL PRODUCTS
      // =================================================
      //
      // Product existence is checked before modifying
      // any stock.
      //
      // =================================================

      const productData =
        [];

      for (
        const item of items
      ) {
        const product =
          await getProduct(
            item.productId
          );

        if (!product) {
          throw new Error(
            `Product not found: ${item.productId}`
          );
        }

        const currentStock =
          Number(
            product.stock || 0
          );

        if (
          currentStock <
          item.quantity
        ) {
          throw new Error(
            `Insufficient stock for ${product.sku || item.productId}. Available: ${currentStock}, requested: ${item.quantity}.`
          );
        }

        productData.push({
          item,
          product,
        });
      }

      // =================================================
      // ATOMIC STOCK DECREASE
      // =================================================

      const updatedProducts =
        [];

      try {
        for (
          const data of
            productData
        ) {
          const {
            item,
          } = data;

          const filter =
            findProductFilter(
              item.productId
            );

          const updated =
            await Product.findOneAndUpdate(
              {
                ...filter,

                stock: {
                  $gte:
                    item.quantity,
                },
              },
              {
                $inc: {
                  stock:
                    -item.quantity,
                },
              },
              {
                new: true,
              }
            );

          if (!updated) {
            throw new Error(
              `Stock changed before update for ${item.productId}. Please retry the order.`
            );
          }

          updatedProducts.push({
            item,
            product:
              updated,
          });
        }
      } catch (stockError) {
        // =================================================
        // COMPENSATE PREVIOUS SUCCESSFUL UPDATES
        // =================================================

        let compensationFailed =
          false;

        for (
          const successItem of
            updatedProducts
        ) {
          try {
            const filter =
              findProductFilter(
                successItem.item
                  .productId
              );

            await Product.findOneAndUpdate(
              filter,
              {
                $inc: {
                  stock:
                    successItem.item
                      .quantity,
                },
              }
            );
          } catch (
            compensationError
          ) {
            compensationFailed =
              true;

            console.error(
              "CRITICAL STOCK COMPENSATION FAILURE:",
              {
                productId:
                  successItem.item
                    .productId,

                quantity:
                  successItem.item
                    .quantity,

                error:
                  compensationError
                    .message,
              }
            );
          }
        }

        operation.status =
          "failed";

        operation.errorMessage =
          stockError.message;

        operation.compensationFailed =
          compensationFailed;

        await operation.save();

        return res.status(400).json({
          success: false,

          operationId,

          message:
            stockError.message,

          compensationFailed,
        });
      }

      // =================================================
      // BUILD RESULT
      // =================================================

      const products =
        updatedProducts.map(
          ({
            item,
            product,
          }) => ({
            productId:
              item.productId,

            mongoId:
              product._id
                ?.toString() || "",

            sku:
              product.sku || "",

            quantity:
              item.quantity,

            remainingStock:
              Number(
                product.stock || 0
              ),
          })
        );

      // =================================================
      // MARK COMPLETED
      // =================================================

      operation.status =
        "completed";

      operation.products =
        products;

      operation.errorMessage =
        "";

      await operation.save();

      // =================================================
      // SUCCESS
      // =================================================

      return res.status(200).json({
        success: true,

        alreadyProcessed:
          false,

        operationId,

        message:
          "Stock decreased successfully.",

        products,
      });
    } catch (error) {
      console.error(
        "=========================================="
      );

      console.error(
        "INTERNAL STOCK DECREASE ERROR"
      );

      console.error(
        "Message:",
        error.message
      );

      console.error(
        "=========================================="
      );

      // -------------------------------------------------
      // MARK OPERATION FAILED
      // -------------------------------------------------

      if (
        operation &&
        operation.status ===
          "processing"
      ) {
        try {
          operation.status =
            "failed";

          operation.errorMessage =
            error.message;

          await operation.save();
        } catch (
          saveError
        ) {
          console.error(
            "Failed to save stock operation error:",
            saveError.message
          );
        }
      }

      return res.status(400).json({
        success: false,

        message:
          error.message ||
          "Stock decrease failed.",
      });
    }
  };

// =====================================================
// INCREASE / ROLLBACK STOCK
// =====================================================
//
// IMPORTANT:
//
// Client ko direct arbitrary increase allow nahi hai.
//
// Public backend original decrease operationId
// bhejega.
//
// Example:
//
// operationId:
//   550e8400...
//
// Internal rollback operation:
//   rollback:550e8400...
//
// Same rollback retry:
//   stock dobara increase nahi hoga.
//
// =====================================================

const increaseStock =
  async (
    req,
    res
  ) => {
    let rollbackOperation =
      null;

    try {
      // =================================================
      // ORIGINAL OPERATION ID
      // =================================================

      const originalOperationId =
        String(
          req.body?.operationId ||
            ""
        ).trim();

      if (
        !originalOperationId
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Original stock operationId is required.",
        });
      }

      // =================================================
      // FIND ORIGINAL DECREASE
      // =================================================

      const originalOperation =
        await StockOperation.findOne({
          operationId:
            originalOperationId,

          type:
            "decrease",
        });

      if (!originalOperation) {
        return res.status(404).json({
          success: false,

          message:
            "Original stock decrease operation not found.",
        });
      }

      // =================================================
      // ONLY COMPLETED DECREASE CAN ROLLBACK
      // =================================================

      if (
        originalOperation.status !==
        "completed"
      ) {
        return res.status(409).json({
          success: false,

          message:
            "Only a completed stock decrease can be rolled back.",
        });
      }

      // =================================================
      // DERIVE UNIQUE ROLLBACK ID
      // =================================================

      const rollbackOperationId =
        `rollback:${originalOperationId}`;

      // =================================================
      // IDEMPOTENCY CHECK
      // =================================================

      const existingRollback =
        await StockOperation.findOne({
          operationId:
            rollbackOperationId,
        });

      if (existingRollback) {
        // -----------------------------------------------
        // ALREADY COMPLETED
        // -----------------------------------------------

        if (
          existingRollback.status ===
          "completed"
        ) {
          return res.status(200).json({
            success: true,

            alreadyProcessed:
              true,

            operationId:
              rollbackOperationId,

            originalOperationId,

            message:
              "Stock rollback already processed.",

            products:
              existingRollback.products,
          });
        }

        // -----------------------------------------------
        // PROCESSING
        // -----------------------------------------------

        if (
          existingRollback.status ===
          "processing"
        ) {
          return res.status(409).json({
            success: false,

            processing: true,

            operationId:
              rollbackOperationId,

            message:
              "Stock rollback is already being processed.",
          });
        }

        // -----------------------------------------------
        // FAILED
        // -----------------------------------------------

        return res.status(409).json({
          success: false,

          operationId:
            rollbackOperationId,

          message:
            "This rollback previously failed and requires manual review.",
        });
      }

      // =================================================
      // USE ORIGINAL ITEMS
      // =================================================

      const items =
        normalizeItems(
          originalOperation.items
        );

      // =================================================
      // CREATE ROLLBACK OPERATION
      // =================================================

      try {
        rollbackOperation =
          await StockOperation.create(
            {
              operationId:
                rollbackOperationId,

              type:
                "rollback",

              originalOperationId,

              status:
                "processing",

              items,
            }
          );
      } catch (error) {
        if (
          error?.code === 11000
        ) {
          const raced =
            await StockOperation.findOne(
              {
                operationId:
                  rollbackOperationId,
              }
            );

          if (
            raced?.status ===
            "completed"
          ) {
            return res.status(200).json({
              success: true,

              alreadyProcessed:
                true,

              operationId:
                rollbackOperationId,

              originalOperationId,

              products:
                raced.products,
            });
          }

          return res.status(409).json({
            success: false,

            operationId:
              rollbackOperationId,

            message:
              "Rollback is already being processed.",
          });
        }

        throw error;
      }

      // =================================================
      // PRE-VALIDATE PRODUCTS
      // =================================================

      for (
        const item of items
      ) {
        const product =
          await getProduct(
            item.productId
          );

        if (!product) {
          throw new Error(
            `Product not found during rollback: ${item.productId}`
          );
        }
      }

      // =================================================
      // INCREASE STOCK
      // =================================================

      const products =
        [];

      try {
        for (
          const item of items
        ) {
          const filter =
            findProductFilter(
              item.productId
            );

          const updated =
            await Product.findOneAndUpdate(
              filter,
              {
                $inc: {
                  stock:
                    item.quantity,
                },
              },
              {
                new: true,
              }
            );

          if (!updated) {
            throw new Error(
              `Unable to restore stock for ${item.productId}.`
            );
          }

          products.push({
            productId:
              item.productId,

            mongoId:
              updated._id
                ?.toString() || "",

            sku:
              updated.sku || "",

            quantity:
              item.quantity,

            remainingStock:
              Number(
                updated.stock || 0
              ),
          });
        }
      } catch (error) {
        rollbackOperation.status =
          "failed";

        rollbackOperation.errorMessage =
          error.message;

        rollbackOperation.compensationFailed =
          true;

        await rollbackOperation.save();

        return res.status(500).json({
          success: false,

          operationId:
            rollbackOperationId,

          message:
            "Stock rollback failed. Manual stock review may be required.",
        });
      }

      // =================================================
      // MARK COMPLETED
      // =================================================

      rollbackOperation.status =
        "completed";

      rollbackOperation.products =
        products;

      rollbackOperation.errorMessage =
        "";

      await rollbackOperation.save();

      // =================================================
      // SUCCESS
      // =================================================

      return res.status(200).json({
        success: true,

        alreadyProcessed:
          false,

        operationId:
          rollbackOperationId,

        originalOperationId,

        message:
          "Stock rollback completed successfully.",

        products,
      });
    } catch (error) {
      console.error(
        "=========================================="
      );

      console.error(
        "INTERNAL STOCK ROLLBACK ERROR"
      );

      console.error(
        "Message:",
        error.message
      );

      console.error(
        "=========================================="
      );

      if (
        rollbackOperation &&
        rollbackOperation.status ===
          "processing"
      ) {
        try {
          rollbackOperation.status =
            "failed";

          rollbackOperation.errorMessage =
            error.message;

          await rollbackOperation.save();
        } catch (
          saveError
        ) {
          console.error(
            "Failed to save rollback error:",
            saveError.message
          );
        }
      }

      return res.status(400).json({
        success: false,

        message:
          error.message ||
          "Stock rollback failed.",
      });
    }
  };

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  decreaseStock,
  increaseStock,
};