const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
    },

    saleDate: {
      type: String,
      required: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    customerName: {
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

    totalAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

saleSchema.pre("save", function (next) {
  this.totalAmount =
    Number(this.sellingPrice || 0) *
    Number(this.quantity || 0);

  next();
});

saleSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (
    update.sellingPrice !== undefined ||
    update.quantity !== undefined
  ) {
    const sellingPrice =
      Number(update.sellingPrice || 0);

    const quantity =
      Number(update.quantity || 0);

    update.totalAmount = sellingPrice * quantity;
  }

  next();
});

module.exports = mongoose.model("Sale", saleSchema);