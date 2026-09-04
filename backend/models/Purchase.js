const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
    },

    purchaseDate: {
      type: String,
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    rawCost: {
      type: Number,
      required: true,
      min: 0,
    },

    supplierName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    productImage: {
      type: String,
      default: "",
    },

    totalExpense: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically calculate total expense
purchaseSchema.pre("save", function (next) {
  this.totalExpense =
    Number(this.rawCost || 0) * Number(this.quantity || 0);

  next();
});

module.exports = mongoose.model("Purchase", purchaseSchema);