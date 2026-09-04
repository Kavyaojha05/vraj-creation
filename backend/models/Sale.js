const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      default: "",
    },
    productName: {
      type: String,
      default: "",
    },
    productImage: {
      type: String,
      default: "",
    },
    platform: {
      type: String,
      default: "meesho",
    },
    date: {
      type: String,
      default: "",
    },
    quantity: {
      type: Number,
      default: 1,
    },
    bankSettlementAmount: {
      type: Number,
      default: 0,
    },
    packagingCost: {
      type: Number,
      default: 0,
    },
    colouringCost: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    strict: false, // Strict false se extra fields aane par bhi error throw nahi karega
  }
);

module.exports = mongoose.model("Sale", saleSchema);