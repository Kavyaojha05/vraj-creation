// =====================================================
// VRAJ CREATION - STOCK OPERATION MODEL
//
// Used for idempotent stock decrease / rollback.
//
// One operationId = one stock operation.
//
// decrease:
//   operationId: original UUID
//
// rollback:
//   operationId: rollback:<original UUID>
//   originalOperationId: original UUID
// =====================================================

const mongoose = require("mongoose");

// =====================================================
// STOCK ITEM SCHEMA
// =====================================================

const stockItemSchema =
  new mongoose.Schema(
    {
      productId: {
        type: String,
        required: true,
        trim: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },
    },
    {
      _id: false,
    }
  );

// =====================================================
// PROCESSED PRODUCT SCHEMA
// =====================================================

const processedProductSchema =
  new mongoose.Schema(
    {
      productId: {
        type: String,
        required: true,
        trim: true,
      },

      mongoId: {
        type: String,
        default: "",
        trim: true,
      },

      sku: {
        type: String,
        default: "",
        trim: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },

      remainingStock: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    {
      _id: false,
    }
  );

// =====================================================
// MAIN SCHEMA
// =====================================================

const stockOperationSchema =
  new mongoose.Schema(
    {
      // -------------------------------------------------
      // Unique operation identifier
      // -------------------------------------------------

      operationId: {
        type: String,
        required: true,
        unique: true,
        index: true,
        trim: true,
      },

      // -------------------------------------------------
      // Operation type
      // -------------------------------------------------

      type: {
        type: String,
        required: true,
        enum: [
          "decrease",
          "rollback",
        ],
        index: true,
      },

      // -------------------------------------------------
      // Original decrease operation
      //
      // Required for rollback operations.
      // -------------------------------------------------

      originalOperationId: {
        type: String,
        default: "",
        trim: true,
        index: true,
      },

      // -------------------------------------------------
      // Operation status
      // -------------------------------------------------

      status: {
        type: String,
        required: true,
        enum: [
          "processing",
          "completed",
          "failed",
        ],
        default: "processing",
        index: true,
      },

      // -------------------------------------------------
      // Requested stock items
      // -------------------------------------------------

      items: {
        type: [
          stockItemSchema,
        ],
        default: [],
      },

      // -------------------------------------------------
      // Products actually processed
      // -------------------------------------------------

      products: {
        type: [
          processedProductSchema,
        ],
        default: [],
      },

      // -------------------------------------------------
      // Error information
      // -------------------------------------------------

      errorMessage: {
        type: String,
        default: "",
        trim: true,
      },

      // -------------------------------------------------
      // True if automatic compensation failed
      // -------------------------------------------------

      compensationFailed: {
        type: Boolean,
        default: false,
      },
    },

    {
      timestamps: true,
    }
  );

// =====================================================
// INDEXES
// =====================================================

stockOperationSchema.index({
  operationId: 1,
});

stockOperationSchema.index({
  originalOperationId: 1,
});

stockOperationSchema.index({
  type: 1,
  status: 1,
});

stockOperationSchema.index({
  createdAt: -1,
});

// =====================================================
// MODEL
// =====================================================

const StockOperation =
  mongoose.model(
    "StockOperation",
    stockOperationSchema
  );

module.exports =
  StockOperation;