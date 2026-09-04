const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
<<<<<<< HEAD
      default: "",
    },
    productName: {
      type: String,
      default: "",
    },
=======
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

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
    productImage: {
      type: String,
      default: "",
    },
<<<<<<< HEAD
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
=======

    totalAmount: {
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
<<<<<<< HEAD
    strict: false, // Strict false se extra fields aane par bhi error throw nahi karega
  }
);

=======
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

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
module.exports = mongoose.model("Sale", saleSchema);