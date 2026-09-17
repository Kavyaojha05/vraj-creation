
const crypto = require("crypto");

const Order = require("../models/Order");
const Product = require("../models/Product");

// =====================================================
// CONFIGURATION
// =====================================================

// 5001 = Coupon / Spin & Win backend
//
// LOCAL:
// http://localhost:5001/api
//
// LIVE:
// https://YOUR-5001-BACKEND.onrender.com/api
//
// IMPORTANT:
// Render deployment ke baad .env me COUPON_API_URL set karein.

const COUPON_API_URL =
  process.env.COUPON_API_URL ||
  "http://localhost:5001/api";

const BUSINESS_NAME = "Vraj Creation";
const BUSINESS_WHATSAPP = "918824968974";

// =====================================================
// HELPERS
// =====================================================

// Normalize text
const normalizeText = (value) => {
  return String(value || "").trim();
};

// Normalize mobile
const normalizeMobile = (mobile) => {
  return String(mobile || "")
    .replace(/\D/g, "")
    .slice(-10);
};

// Validate Indian mobile
const isValidMobile = (mobile) => {
  return /^[6-9]\d{9}$/.test(mobile);
};

// Normalize coupon
const normalizeCouponCode = (code) => {
  return String(code || "")
    .trim()
    .toUpperCase();
};

// Convert number safely
const toNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};

// Round money
const roundMoney = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

// =====================================================
// ORDER NUMBER
// =====================================================

const generateOrderNumber = () => {
  const date = new Date();

  const yyyy = date.getFullYear();

  const mm = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const dd = String(
    date.getDate()
  ).padStart(2, "0");

  const random = crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();

  return `VRAJ-${yyyy}${mm}${dd}-${random}`;
};

// =====================================================
// COUPON API REQUEST
// =====================================================

const couponApiRequest = async (
  endpoint,
  options = {}
) => {
  const url =
    `${COUPON_API_URL}${endpoint}`;

  try {
    const response = await fetch(
      url,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          ...(options.headers || {}),
        },
      }
    );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  } catch (error) {
    console.error(
      "COUPON API CONNECTION ERROR:",
      error
    );

    throw new Error(
      "Coupon service is currently unavailable. Please try again."
    );
  }
};

// =====================================================
// GET COUPON INFORMATION
// =====================================================

const getCouponByCodeFromService = async (
  couponCode
) => {
  const result =
    await couponApiRequest(
      `/coupons/code/${encodeURIComponent(
        couponCode
      )}`,
      {
        method: "GET",
      }
    );

  if (!result.ok) {
    return null;
  }

  return result.data?.coupon || null;
};

// =====================================================
// VALIDATE COUPON THROUGH 5001
// =====================================================
//
// IMPORTANT:
// We do NOT trust frontend discount values.
//
// 5000 sends the real server-calculated subtotal
// to 5001.
//
// 5001 decides whether coupon is valid.

const validateCouponThroughService = async ({
  code,
  mobile,
  orderAmount,
  category,
}) => {
  const couponCode =
    normalizeCouponCode(code);

  if (!couponCode) {
    return {
      valid: false,
      message: "Coupon code is empty.",
    };
  }

  const payload = {
    code: couponCode,
    orderAmount,
  };

  // ---------------------------------------------------
  // IMPORTANT
  // ---------------------------------------------------
  // Mobile is intentionally sent only when available.
  //
  // For Spin & Win:
  // validateCoupon in 5001 checks CouponClaim and
  // returns alreadyUsed if mobile has a claim.
  //
  // Therefore we first validate the coupon itself.
  // Spin & Win ownership is verified during /use
  // after successful order creation.

  if (category) {
    payload.category = category;
  }

  const result =
    await couponApiRequest(
      "/coupons/validate",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );

  if (!result.ok) {
    return {
      valid: false,

      alreadyUsed:
        Boolean(
          result.data?.alreadyUsed
        ),

      categoryMismatch:
        Boolean(
          result.data?.categoryMismatch
        ),

      message:
        result.data?.message ||
        "Invalid coupon.",
    };
  }

  return {
    valid:
      result.data?.valid === true,

    coupon:
      result.data?.coupon || null,

    message:
      result.data?.message ||
      "Coupon is valid.",
  };
};

// =====================================================
// USE SPIN & WIN COUPON
// =====================================================
//
// This is called AFTER the order is successfully created.
//
// Why after order?
//
// Because /use changes CouponClaim status from:
// claimed → used
//
// If order creation fails, customer should not lose
// the coupon.

const useSpinCoupon = async ({
  code,
  mobile,
}) => {
  const couponCode =
    normalizeCouponCode(code);

  const cleanMobile =
    normalizeMobile(mobile);

  if (
    !couponCode ||
    !isValidMobile(cleanMobile)
  ) {
    return {
      success: false,
      message:
        "Invalid coupon or mobile number.",
    };
  }

  const result =
    await couponApiRequest(
      "/coupons/use",
      {
        method: "POST",

        body: JSON.stringify({
          code: couponCode,
          mobile: cleanMobile,
        }),
      }
    );

  return {
    success: result.ok &&
      result.data?.success === true,

    status:
      result.status,

    data:
      result.data,
  };
};

// =====================================================
// CREATE ORDER
// POST /api/orders
// =====================================================

const createOrder = async (
  req,
  res
) => {
  try {
    const {
      customer = {},
      items = [],
      coupon = null,
    } = req.body;

    // =================================================
    // CUSTOMER
    // =================================================

    const fullName =
      normalizeText(
        customer.fullName
      );

    const mobile =
      normalizeMobile(
        customer.mobile
      );

    const email =
      normalizeText(
        customer.email
      );

    const address =
      normalizeText(
        customer.address
      );

    const city =
      normalizeText(
        customer.city
      );

    const pincode =
      normalizeText(
        customer.pincode
      );

    // -------------------------------------------------
    // REQUIRED CUSTOMER FIELDS
    // -------------------------------------------------

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message:
          "Customer name is required.",
      });
    }

    if (
      !isValidMobile(mobile)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10-digit mobile number.",
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message:
          "Customer address is required.",
      });
    }

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message:
          "Customer pincode is required.",
      });
    }

    // City optional rakha hai.
    // Agar frontend city bhejta hai to save hoga.

    // =================================================
    // ITEMS VALIDATION
    // =================================================

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one product is required.",
      });
    }

    // =================================================
    // MERGE DUPLICATE PRODUCTS
    // =================================================

    const groupedItems =
      new Map();

    for (const item of items) {
      if (!item) {
        continue;
      }

      const productId =
        normalizeText(
          item.productId
        );

      const sku =
        normalizeText(
          item.sku
        ).toUpperCase();

      const key =
        productId ||
        sku;

      if (!key) {
        return res.status(400).json({
          success: false,
          message:
            "Product ID or SKU is required.",
        });
      }

      const quantity =
        Math.floor(
          toNumber(
            item.quantity,
            0
          )
        );

      if (
        quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Product quantity must be at least 1.",
        });
      }

      if (
        groupedItems.has(key)
      ) {
        groupedItems.get(key).quantity +=
          quantity;
      } else {
        groupedItems.set(key, {
          productId,
          sku,
          quantity,
        });
      }
    }

    const normalizedItems =
      Array.from(
        groupedItems.values()
      );

    if (
      normalizedItems.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No valid products found.",
      });
    }

    // =================================================
    // LOAD PRODUCTS FROM 5000 DATABASE
    // =================================================
    //
    // IMPORTANT:
    //
    // Frontend price is NOT trusted.
    //
    // We use:
    // Product.sellingPrice
    //
    // Frontend only sends:
    // productId / SKU / quantity

    const orderItems = [];

    for (
      const requestedItem of normalizedItems
    ) {
      let product = null;

      // ------------------------------------------------
      // FIND BY MONGODB ID
      // ------------------------------------------------

      if (
        requestedItem.productId &&
        /^[0-9a-fA-F]{24}$/.test(
          requestedItem.productId
        )
      ) {
        product =
          await Product.findById(
            requestedItem.productId
          );
      }

      // ------------------------------------------------
      // FALLBACK: FIND BY SKU
      // ------------------------------------------------

      if (
        !product &&
        requestedItem.sku
      ) {
        product =
          await Product.findOne({
            sku:
              requestedItem.sku,
          });
      }

      // ------------------------------------------------
      // PRODUCT NOT FOUND
      // ------------------------------------------------

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            `Product not found: ${
              requestedItem.productId ||
              requestedItem.sku
            }`,
        });
      }

      // ------------------------------------------------
      // PRODUCT STATUS
      // ------------------------------------------------

      if (
        product.status &&
        String(
          product.status
        ).toLowerCase() !==
          "active"
      ) {
        return res.status(400).json({
          success: false,
          message:
            `${product.name} is currently unavailable.`,
        });
      }

      // ------------------------------------------------
      // STOCK
      // ------------------------------------------------

      const currentStock =
        toNumber(
          product.stock,
          0
        );

      const requestedQuantity =
        requestedItem.quantity;

      if (
        currentStock <
        requestedQuantity
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Only ${currentStock} ${
              product.name
            } available in stock.`,
          productId:
            product._id,
          stock:
            currentStock,
        });
      }

      // ------------------------------------------------
      // SELLING PRICE
      // ------------------------------------------------

      const sellingPrice =
        toNumber(
          product.sellingPrice,
          0
        );

      if (
        sellingPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            `Invalid selling price for ${product.name}.`,
        });
      }

      const itemSubtotal =
        roundMoney(
          sellingPrice *
            requestedQuantity
        );

      // ------------------------------------------------
      // SNAPSHOT PRODUCT DATA
      // ------------------------------------------------

      orderItems.push({
        productId:
          product._id,

        sku:
          normalizeText(
            product.sku
          ).toUpperCase(),

        name:
          normalizeText(
            product.name
          ),

        category:
          normalizeText(
            product.category
          ),

        subcategory:
          normalizeText(
            product.subcategory
          ),

        image:
          normalizeText(
            product.image
          ),

        description:
          normalizeText(
            product.description
          ),

        size:
          normalizeText(
            product.size
          ),

        quantity:
          requestedQuantity,

        price:
          sellingPrice,

        subtotal:
          itemSubtotal,
      });
    }

    // =================================================
    // SUBTOTAL
    // =================================================

    const subtotal =
      roundMoney(
        orderItems.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.subtotal
            ),
          0
        )
      );

    if (
      subtotal < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order subtotal.",
      });
    }

    // =================================================
    // TOTAL ITEMS
    // =================================================

    const totalItems =
      orderItems.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity
          ),
        0
      );

    // =================================================
    // COUPON
    // =================================================

    let couponCode = "";
    let couponDiscount = 0;
    let discountPercent = 0;
    let discountScope = "all";
    let couponCategory = null;
    let minOrderAmount = 0;
    let maxDiscount = null;
    let eligibleSubtotal = subtotal;
    let couponValidated = false;
    let couponSource = null;

    // -------------------------------------------------
    // IF COUPON WAS SENT
    // -------------------------------------------------

    if (
      coupon &&
      typeof coupon === "object"
    ) {
      couponCode =
        normalizeCouponCode(
          coupon.code ||
          coupon.couponCode
        );

      if (couponCode) {
        // =============================================
        // GET REAL COUPON DATA FROM 5001
        // =============================================

        const realCoupon =
          await getCouponByCodeFromService(
            couponCode
          );

        if (!realCoupon) {
          return res.status(400).json({
            success: false,
            message:
              "Invalid coupon code.",
          });
        }

        couponSource =
          realCoupon.source ||
          null;

        // =============================================
        // CATEGORY
        // =============================================

        discountScope =
          realCoupon.discountScope ===
          "category"
            ? "category"
            : "all";

        couponCategory =
          realCoupon.category ||
          null;

        // =============================================
        // FIND ELIGIBLE ITEMS
        // =============================================

        if (
          discountScope ===
          "category"
        ) {
          if (
            !couponCategory
          ) {
            return res.status(400).json({
              success: false,
              message:
                "Coupon category is missing.",
            });
          }

          const matchingItems =
            orderItems.filter(
              (item) =>
                String(
                  item.category
                )
                  .trim()
                  .toLowerCase() ===
                String(
                  couponCategory
                )
                  .trim()
                  .toLowerCase()
            );

          if (
            matchingItems.length ===
            0
          ) {
            return res.status(400).json({
              success: false,
              message:
                `This coupon is valid only for ${couponCategory}.`,
            });
          }

          eligibleSubtotal =
            roundMoney(
              matchingItems.reduce(
                (
                  total,
                  item
                ) =>
                  total +
                  Number(
                    item.subtotal
                  ),
                0
              )
            );
        } else {
          eligibleSubtotal =
            subtotal;
        }

        // =============================================
        // REAL MINIMUM ORDER
        // =============================================

        minOrderAmount =
          Math.max(
            0,
            toNumber(
              realCoupon.minOrderAmount,
              0
            )
          );

        if (
          subtotal <
          minOrderAmount
        ) {
          return res.status(400).json({
            success: false,
            message:
              `Minimum order amount is ₹${minOrderAmount}.`,
          });
        }

        // =============================================
        // SERVER-SIDE COUPON VALIDATION
        // =============================================

        const validation =
          await validateCouponThroughService(
            {
              code:
                couponCode,

              mobile:
                mobile,

              orderAmount:
                eligibleSubtotal,

              category:
                discountScope ===
                "category"
                  ? couponCategory
                  : undefined,
            }
          );

        if (
          !validation.valid
        ) {
          return res.status(400).json({
            success: false,
            message:
              validation.message ||
              "Coupon is not valid.",
          });
        }

        couponValidated =
          true;

        // =============================================
        // USE REAL DISCOUNT
        // =============================================
        //
        // NEVER use:
        // coupon.discount
        //
        // from frontend.
        //
        // Use:
        // 5001 coupon data.

        discountPercent =
          toNumber(
            realCoupon.discount,
            0
          );

        if (
          discountPercent <=
            0
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Coupon discount is invalid.",
          });
        }

        // =============================================
        // MAX DISCOUNT
        // =============================================

        if (
          realCoupon.maxDiscount !==
            null &&
          realCoupon.maxDiscount !==
            undefined
        ) {
          maxDiscount =
            Math.max(
              0,
              toNumber(
                realCoupon.maxDiscount,
                0
              )
            );
        }

        // =============================================
        // CALCULATE DISCOUNT
        // =============================================

        couponDiscount =
          roundMoney(
            (eligibleSubtotal *
              discountPercent) /
              100
          );

        // =============================================
        // APPLY MAX DISCOUNT
        // =============================================

        if (
          maxDiscount !==
            null
        ) {
          couponDiscount =
            Math.min(
              couponDiscount,
              maxDiscount
            );
        }

        // =============================================
        // NEVER EXCEED ELIGIBLE SUBTOTAL
        // =============================================

        couponDiscount =
          Math.min(
            couponDiscount,
            eligibleSubtotal
          );

        couponDiscount =
          roundMoney(
            couponDiscount
          );
      }
    }

    // =================================================
    // FINAL TOTAL
    // =================================================

    const finalTotal =
      roundMoney(
        Math.max(
          0,
          subtotal -
            couponDiscount
        )
      );

    // =================================================
    // ORDER NUMBER
    // =================================================

    let orderNumber =
      generateOrderNumber();

    // =================================================
    // CREATE ORDER
    // =================================================

    const orderData = {
      orderNumber,

      status:
        "pending",

      customer: {
        fullName,

        mobile,

        email,

        address,

        city,

        pincode,
      },

      items:
        orderItems,

      totalItems,

      coupon:
        couponValidated
          ? {
              code:
                couponCode,

              discount:
                discountPercent,

              discountScope:
                discountScope,

              category:
                couponCategory,

              minOrderAmount:
                minOrderAmount,

              maxDiscount:
                maxDiscount,
            }
          : null,

      pricing: {
        subtotal,

        eligibleSubtotal:
          couponValidated
            ? eligibleSubtotal
            : subtotal,

        discountPercent:
          couponValidated
            ? discountPercent
            : 0,

        discount:
          couponDiscount,

        couponDiscount:
          couponDiscount,

        couponCode:
          couponValidated
            ? couponCode
            : "",

        finalTotal,

        finalAmount:
          finalTotal,
      },

      business: {
        name:
          BUSINESS_NAME,

        whatsapp:
          BUSINESS_WHATSAPP,
      },

      customerPdfUrl:
        "",

      adminPdfUrl:
        "",

      customerWhatsappSent:
        false,

      adminWhatsappSent:
        false,

      customerNote:
        "",

      adminNote:
        "",
    };

    let newOrder;

    try {
      newOrder =
        await Order.create(
          orderData
        );
    } catch (orderError) {
      // ----------------------------------------------
      // Duplicate order number retry
      // ----------------------------------------------

      if (
        orderError.code ===
        11000
      ) {
        orderNumber =
          generateOrderNumber();

        orderData.orderNumber =
          orderNumber;

        newOrder =
          await Order.create(
            orderData
          );
      } else {
        throw orderError;
      }
    }

    // =================================================
    // REDUCE STOCK
    // =================================================
    //
    // IMPORTANT:
    // Order already exists.
    //
    // We update stock using $inc.
    //
    // If stock somehow changed between the first
    // validation and this update, the condition
    // prevents negative stock.

    try {
      for (
        const item of orderItems
      ) {
        const updatedProduct =
          await Product.findOneAndUpdate(
            {
              _id:
                item.productId,

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

        if (
          !updatedProduct
        ) {
          // ------------------------------------------
          // Stock race condition
          // ------------------------------------------

          // Best-effort restore already reduced stock
          // for previous items.

          for (
            const rollbackItem of orderItems
          ) {
            if (
              String(
                rollbackItem.productId
              ) ===
              String(
                item.productId
              )
            ) {
              break;
            }

            await Product.findByIdAndUpdate(
              rollbackItem.productId,
              {
                $inc: {
                  stock:
                    rollbackItem.quantity,
                },
              }
            );
          }

          await Order.findByIdAndDelete(
            newOrder._id
          );

          return res.status(409).json({
            success: false,
            message:
              `Stock changed while placing the order for ${item.name}. Please try again.`,
          });
        }
      }
    } catch (stockError) {
      console.error(
        "STOCK UPDATE ERROR:",
        stockError
      );

      // Best-effort rollback
      for (
        const rollbackItem of orderItems
      ) {
        await Product.findByIdAndUpdate(
          rollbackItem.productId,
          {
            $inc: {
              stock:
                rollbackItem.quantity,
            },
          }
        );
      }

      await Order.findByIdAndDelete(
        newOrder._id
      );

      throw stockError;
    }

    // =================================================
    // USE SPIN & WIN COUPON
    // =================================================
    //
    // This happens ONLY after:
    //
    // 1. Coupon validated
    // 2. Order created
    // 3. Stock reduced
    //
    // If coupon is from Spin & Win,
    // /coupons/use verifies:
    //
    // mobile + coupon claim
    //
    // and changes claim:
    //
    // claimed → used

    let couponUseResult =
      null;

    if (
      couponValidated &&
      couponSource ===
        "Spin & Win"
    ) {
      couponUseResult =
        await useSpinCoupon({
          code:
            couponCode,

          mobile:
            mobile,
        });

      // ------------------------------------------------
      // IMPORTANT
      // ------------------------------------------------
      // Do NOT delete the order if /use fails.
      //
      // The coupon has already been claimed/reserved
      // during Spin & Win.
      //
      // Customer can still be protected by the claim.
      // We log the issue for admin investigation.

      if (
        !couponUseResult.success
      ) {
        console.error(
          "SPIN COUPON USE FAILED:",
          couponUseResult
        );
      }
    }

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,

      message:
        "Order placed successfully.",

      order:
        newOrder,

      coupon: {
        applied:
          couponValidated,

        code:
          couponValidated
            ? couponCode
            : "",

        discountPercent:
          couponValidated
            ? discountPercent
            : 0,

        discount:
          couponDiscount,

        source:
          couponSource,
      },

      stockUpdated:
        true,

      couponUsed:
        couponUseResult
          ? couponUseResult.success
          : false,
    });
  } catch (error) {
    console.error(
      "CREATE ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create order.",
      error:
        process.env.NODE_ENV ===
        "production"
          ? undefined
          : error.message,
    });
  }
};

// =====================================================
// GET ORDER BY ORDER NUMBER
// GET /api/orders/:orderNumber
// =====================================================

const getOrderByNumber = async (
  req,
  res
) => {
  try {
    const orderNumber =
      normalizeText(
        req.params.orderNumber
      ).toUpperCase();

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message:
          "Order number is required.",
      });
    }

    const order =
      await Order.findOne({
        orderNumber,
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message:
          "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error(
      "GET ORDER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch order.",
      error:
        error.message,
    });
  }
};

// =====================================================
// GET ALL ORDERS
// GET /api/orders
// =====================================================

const getAllOrders = async (
  req,
  res
) => {
  try {
    const orders =
      await Order.find()
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,

      count:
        orders.length,

      orders,
    });
  } catch (error) {
    console.error(
      "GET ALL ORDERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch orders.",
      error:
        error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createOrder,
  getOrderByNumber,
  getAllOrders,
};
