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

    // Sale platform
    platform: {
      type: String,
      default: "meesho",
      trim: true,
      lowercase: true,
    },

    // Sale date
    saleDate: {
      type: String,
      default: "",
    },

    // Kept for compatibility with existing frontend
    date: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },

    // Amount received/settled by marketplace
    bankSettlementAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Optional sale-related costs
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

    // Selling price per item
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Kept for compatibility with alternate sales flow
    customerName: {
      type: String,
      default: "",
      trim: true,
    },

    // Automatically calculated total
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// =====================================================
// CALCULATE TOTAL AMOUNT BEFORE SAVE
// =====================================================
saleSchema.pre("save", function (next) {
  this.totalAmount =
    Number(this.sellingPrice || 0) *
    Number(this.quantity || 0);

  next();
});

// =====================================================
// CALCULATE TOTAL AMOUNT BEFORE UPDATE
// =====================================================
saleSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  const sellingPrice =
    update.sellingPrice !== undefined
      ? Number(update.sellingPrice || 0)
      : undefined;

  const quantity =
    update.quantity !== undefined
      ? Number(update.quantity || 0)
      : undefined;

  if (sellingPrice !== undefined || quantity !== undefined) {
    const currentTotal =
      Number(sellingPrice ?? 0) *
      Number(quantity ?? 0);

    update.totalAmount = currentTotal;
  }

  next();
});

module.exports = mongoose.model("Sale", saleSchema);