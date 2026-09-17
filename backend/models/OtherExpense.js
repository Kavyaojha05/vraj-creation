// =====================================================
// VRAJ CREATION - OTHER EXPENSE MODEL
// =====================================================

const mongoose = require("mongoose");

// =====================================================
// SCHEMA
// =====================================================

const otherExpenseSchema = new mongoose.Schema(
  {
    // Optional - plain text only
    productId: {
      type: String,
      default: "",
      trim: true,
    },

    // Manual product/item name
    productName: {
      type: String,
      default: "",
      trim: true,
    },

    // Required supplier name
    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    // Purchase date
    purchaseDate: {
      type: Date,
      required: true,
    },

    // Cost per unit
    purchaseCost: {
      type: Number,
      required: true,
      min: 0,
    },

    // Quantity
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    // Cloudinary image URL
    purchaseImage: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// IMPORTANT
// Prevent OverwriteModelError during nodemon reload
// =====================================================

module.exports =
  mongoose.models.OtherExpense ||
  mongoose.model(
    "OtherExpense",
    otherExpenseSchema
  );