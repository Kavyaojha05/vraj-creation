const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

// =====================================================
// CLOUDINARY UPLOAD HELPER
// =====================================================
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "vraj-creation/purchases",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(fileBuffer);
  });
};

// =====================================================
// GET CLOUDINARY IMAGE URL
// Supports both multer-storage-cloudinary and memory
// =====================================================
const getUploadedImageUrl = (file) => {
  if (!file) return "";

  if (file.path) {
    return file.path;
  }

  if (file.secure_url) {
    return file.secure_url;
  }

  if (file.url) {
    return file.url;
  }

  return "";
};

// =====================================================
// DELETE CLOUDINARY IMAGE
// =====================================================
const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (
      !imageUrl ||
      !imageUrl.includes("cloudinary.com")
    ) {
      return;
    }

    const parts = imageUrl.split("/");

    const uploadIndex = parts.findIndex(
      (part) => part === "upload"
    );

    if (uploadIndex === -1) return;

    let publicIdParts = parts.slice(uploadIndex + 1);

    if (
      publicIdParts[0] &&
      /^v\d+$/.test(publicIdParts[0])
    ) {
      publicIdParts.shift();
    }

    const publicIdWithExtension =
      publicIdParts.join("/");

    const publicId =
      publicIdWithExtension.replace(
        /\.[^/.]+$/,
        ""
      );

    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    console.error(
      "CLOUDINARY DELETE ERROR:",
      error.message
    );
  }
};

// =====================================================
// VALIDATE PRODUCT
// =====================================================
const findProduct = async (productId) => {
  if (!productId) {
    return null;
  }

  return await Product.findById(productId);
};

// =====================================================
// GET ALL PURCHASES
// =====================================================
const getPurchases = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    if (page && limit) {
      const skip = (page - 1) * limit;

      const [purchases, total] = await Promise.all([
        Purchase.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        Purchase.countDocuments(),
      ]);

      return res.status(200).json({
        success: true,
        count: total,
        page,
        pages: Math.ceil(total / limit),
        purchases,
      });
    }

    const purchases = await Purchase.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: purchases.length,
      purchases,
    });
  } catch (error) {
    console.error("GET PURCHASES ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchases",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE PURCHASE
// =====================================================
const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(
      req.params.id
    ).lean();

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase entry not found",
      });
    }

    return res.status(200).json(purchase);
  } catch (error) {
    console.error("GET PURCHASE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch purchase",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE PURCHASE
// =====================================================
const createPurchase = async (req, res) => {
  try {
    const {
      productId,
      purchaseDate,
      productName,
      rawCost,
      supplierName,
      quantity,
    } = req.body;

    // -------------------------------------------------
    // BASIC VALIDATION
    // -------------------------------------------------
    if (
      !productId ||
      !purchaseDate ||
      !productName ||
      !supplierName
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const costNum = Number(rawCost);
    const qtyNum = Number(quantity);

    if (!Number.isFinite(costNum) || costNum <= 0) {
      return res.status(400).json({
        success: false,
        message:
          "Raw cost must be a valid number greater than 0",
      });
    }

    if (
      !Number.isInteger(qtyNum) ||
      qtyNum <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be a whole number greater than 0",
      });
    }

    // -------------------------------------------------
    // FIND PRODUCT
    // -------------------------------------------------
    const product = await findProduct(
      String(productId).trim()
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found. Please enter a valid Product ID.",
      });
    }

    // -------------------------------------------------
    // IMAGE
    // -------------------------------------------------
    let productImage = "";

    if (req.file) {
      // CloudinaryStorage
      if (req.file.path) {
        productImage = req.file.path;
      }

      // MemoryStorage / buffer
      else if (req.file.buffer) {
        const uploadedImage =
          await uploadToCloudinary(
            req.file.buffer
          );

        productImage =
          uploadedImage.secure_url;
      }
    }

    // -------------------------------------------------
    // CREATE PURCHASE
    // -------------------------------------------------
    const purchase = await Purchase.create({
      productId: product._id.toString(),

      purchaseDate: String(purchaseDate),

      // Always use actual Product name
      productName: product.name,

      rawCost: costNum,

      supplierName:
        String(supplierName).trim(),

      quantity: qtyNum,

      productImage,

      totalExpense: costNum * qtyNum,
    });

    // -------------------------------------------------
    // UPDATE PRODUCT STOCK
    // -------------------------------------------------
    product.stock =
      Number(product.stock || 0) + qtyNum;

    await product.save();

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------
    return res.status(201).json({
      success: true,
      message:
        "Purchase added and product stock updated successfully",

      purchase,

      product: {
        _id: product._id,
        name: product.name,
        stock: product.stock,
      },
    });
  } catch (error) {
    console.error(
      "CREATE PURCHASE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to create purchase",
    });
  }
};

// =====================================================
// UPDATE PURCHASE
// =====================================================
const updatePurchase = async (req, res) => {
  try {
    const {
      productId,
      purchaseDate,
      productName,
      rawCost,
      supplierName,
      quantity,
    } = req.body;

    // -------------------------------------------------
    // FIND OLD PURCHASE
    // -------------------------------------------------
    const purchase =
      await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    const oldProductId =
      String(purchase.productId);

    const oldQuantity =
      Number(purchase.quantity || 0);

    const newProductId =
      String(productId || "").trim();

    const newQuantity =
      Number(quantity);

    const costNum =
      Number(rawCost);

    // -------------------------------------------------
    // VALIDATION
    // -------------------------------------------------
    if (!newProductId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    if (
      !Number.isFinite(costNum) ||
      costNum <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Raw cost must be greater than 0",
      });
    }

    if (
      !Number.isInteger(newQuantity) ||
      newQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be a whole number greater than 0",
      });
    }

    // -------------------------------------------------
    // FIND NEW PRODUCT
    // -------------------------------------------------
    const newProduct =
      await findProduct(newProductId);

    if (!newProduct) {
      return res.status(404).json({
        success: false,
        message:
          "New Product not found.",
      });
    }

    // =================================================
    // CASE 1:
    // SAME PRODUCT
    // =================================================
    if (
      oldProductId ===
      newProduct._id.toString()
    ) {
      const difference =
        newQuantity - oldQuantity;

      const currentStock =
        Number(newProduct.stock || 0);

      const newStock =
        currentStock + difference;

      // Prevent negative stock
      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot update purchase because product stock would become negative.",
        });
      }

      newProduct.stock = newStock;

      await newProduct.save();
    }

    // =================================================
    // CASE 2:
    // PRODUCT CHANGED
    // =================================================
    else {
      // -----------------------------------------------
      // FIND OLD PRODUCT
      // -----------------------------------------------
      const oldProduct =
        await Product.findById(
          oldProductId
        );

      if (oldProduct) {
        const oldStock =
          Number(oldProduct.stock || 0);

        const restoredStock =
          oldStock - oldQuantity;

        if (restoredStock < 0) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot change product because old product stock would become negative.",
          });
        }

        oldProduct.stock =
          restoredStock;

        await oldProduct.save();
      }

      // -----------------------------------------------
      // ADD NEW QUANTITY TO NEW PRODUCT
      // -----------------------------------------------
      newProduct.stock =
        Number(newProduct.stock || 0) +
        newQuantity;

      await newProduct.save();
    }

    // -------------------------------------------------
    // UPDATE IMAGE
    // -------------------------------------------------
    if (req.file) {
      const oldImage =
        purchase.productImage;

      let newImage = "";

      if (req.file.path) {
        newImage = req.file.path;
      } else if (req.file.buffer) {
        const uploadedImage =
          await uploadToCloudinary(
            req.file.buffer
          );

        newImage =
          uploadedImage.secure_url;
      }

      if (newImage) {
        purchase.productImage =
          newImage;
      }

      if (oldImage) {
        await deleteFromCloudinary(
          oldImage
        );
      }
    }

    // -------------------------------------------------
    // UPDATE PURCHASE DATA
    // -------------------------------------------------
    purchase.productId =
      newProduct._id.toString();

    purchase.purchaseDate =
      String(purchaseDate);

    purchase.productName =
      newProduct.name;

    purchase.rawCost =
      costNum;

    purchase.supplierName =
      String(supplierName).trim();

    purchase.quantity =
      newQuantity;

    purchase.totalExpense =
      costNum * newQuantity;

    const updatedPurchase =
      await purchase.save();

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------
    return res.status(200).json({
      success: true,

      message:
        "Purchase updated and product stock adjusted successfully",

      purchase: updatedPurchase,

      product: {
        _id: newProduct._id,
        name: newProduct.name,
        stock: newProduct.stock,
      },
    });
  } catch (error) {
    console.error(
      "UPDATE PURCHASE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to update purchase",
    });
  }
};

// =====================================================
// DELETE PURCHASE
// =====================================================
const deletePurchase = async (req, res) => {
  try {
    const purchase =
      await Purchase.findById(
        req.params.id
      );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message:
          "Purchase entry not found",
      });
    }

    // -------------------------------------------------
    // FIND PRODUCT
    // -------------------------------------------------
    const product =
      await Product.findById(
        purchase.productId
      );

    // -------------------------------------------------
    // REMOVE PURCHASE QUANTITY FROM STOCK
    // -------------------------------------------------
    if (product) {
      const currentStock =
        Number(product.stock || 0);

      const purchaseQuantity =
        Number(purchase.quantity || 0);

      const newStock =
        currentStock -
        purchaseQuantity;

      // Prevent negative stock
      if (newStock < 0) {
        return res.status(400).json({
          success: false,
          message:
            "Purchase cannot be deleted because product stock is already lower than this purchase quantity.",
        });
      }

      product.stock =
        newStock;

      await product.save();
    }

    // -------------------------------------------------
    // DELETE PURCHASE IMAGE
    // -------------------------------------------------
    if (purchase.productImage) {
      await deleteFromCloudinary(
        purchase.productImage
      );
    }

    // -------------------------------------------------
    // DELETE PURCHASE
    // -------------------------------------------------
    await Purchase.findByIdAndDelete(
      purchase._id
    );

    return res.status(200).json({
      success: true,

      message:
        "Purchase deleted and product stock adjusted successfully",

      product: product
        ? {
            _id: product._id,
            name: product.name,
            stock: product.stock,
          }
        : null,
    });
  } catch (error) {
    console.error(
      "DELETE PURCHASE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to delete purchase",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================
module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
};