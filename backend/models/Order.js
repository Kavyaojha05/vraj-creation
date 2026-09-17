const mongoose = require("mongoose");

// =====================================================
// ORDER ITEM SCHEMA
// =====================================================

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    subcategory: {
      type: String,
      default: "",
      trim: true,
    },

    image: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    size: {
      type: String,
      default: "",
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
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
// CUSTOMER SCHEMA
// =====================================================

const customerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    pincode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// COUPON SCHEMA
// =====================================================

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountScope: {
      type: String,
      default: "all",
      trim: true,
    },

    category: {
      type: String,
      default: "",
      trim: true,
    },

    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxDiscount: {
      type: Number,
      default: null,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// PRICING SCHEMA
// =====================================================

const pricingSchema = new mongoose.Schema(
  {
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    eligibleSubtotal: {
      type: Number,
      default: 0,
      min: 0,
    },

    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    couponDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    couponCode: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },

    finalTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    finalAmount: {
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
// BUSINESS SCHEMA
// =====================================================

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Vraj Creation",
      trim: true,
    },

    whatsapp: {
      type: String,
      default: "918824968974",
      trim: true,
    },
  },
  {
    _id: false,
  }
);

// =====================================================
// MAIN ORDER SCHEMA
// =====================================================

const orderSchema = new mongoose.Schema(
  {
    // ---------------------------------------------------
    // ORDER NUMBER
    // ---------------------------------------------------

    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },

    // ---------------------------------------------------
    // ORDER STATUS
    // ---------------------------------------------------

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    // ---------------------------------------------------
    // CUSTOMER
    // ---------------------------------------------------

    customer: {
      type: customerSchema,
      required: true,
    },

    // ---------------------------------------------------
    // ITEMS
    // ---------------------------------------------------

    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "Order must contain at least one product.",
      },
    },

    // ---------------------------------------------------
    // TOTAL ITEMS
    // ---------------------------------------------------

    totalItems: {
      type: Number,
      required: true,
      min: 1,
    },

    // ---------------------------------------------------
    // COUPON
    // ---------------------------------------------------

    coupon: {
      type: couponSchema,
      default: null,
    },

    // ---------------------------------------------------
    // PRICING
    // ---------------------------------------------------

    pricing: {
      type: pricingSchema,
      required: true,
    },

    // ---------------------------------------------------
    // BUSINESS
    // ---------------------------------------------------

    business: {
      type: businessSchema,
      default: () => ({
        name: "Vraj Creation",
        whatsapp: "918824968974",
      }),
    },

    // ---------------------------------------------------
    // PDF URLs
    // ---------------------------------------------------

    customerPdfUrl: {
      type: String,
      default: "",
    },

    adminPdfUrl: {
      type: String,
      default: "",
    },

    // ---------------------------------------------------
    // WHATSAPP
    // ---------------------------------------------------

    customerWhatsappSent: {
      type: Boolean,
      default: false,
    },

    adminWhatsappSent: {
      type: Boolean,
      default: false,
    },

    // ---------------------------------------------------
    // NOTES
    // ---------------------------------------------------

    customerNote: {
      type: String,
      default: "",
    },

    adminNote: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// INDEXES
// =====================================================

orderSchema.index({
  "customer.mobile": 1,
});

orderSchema.index({
  createdAt: -1,
});

orderSchema.index({
  status: 1,
  createdAt: -1,
});

// =====================================================
// EXPORT
// =====================================================

module.exports = mongoose.model("Order", orderSchema);