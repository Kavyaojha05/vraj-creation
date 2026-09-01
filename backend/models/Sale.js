const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    productImage: {
      type: String,
      default: "",
    },

    platform: {
      type: String,
      required: true,
      enum: ["meesho", "amazon", "flipkart"],
      lowercase: true,
    },

    date: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    bankSettlementAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    packagingCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    colouringCost: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Sale = mongoose.model("Sale", saleSchema);

module.exports = Sale;