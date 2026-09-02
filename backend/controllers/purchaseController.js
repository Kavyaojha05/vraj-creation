const Purchase = require("../models/Purchase");
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
// DELETE CLOUDINARY IMAGE
// =====================================================
const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl || !imageUrl.includes("cloudinary.com")) {
      return;
    }

    const parts = imageUrl.split("/");

    const uploadIndex = parts.findIndex(
      (part) => part === "upload"
    );

    if (uploadIndex === -1) return;

    let publicIdParts = parts.slice(uploadIndex + 1);

    // Remove version folder such as v123456
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
// GET ALL PURCHASES
// =====================================================
const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find().sort({
      createdAt: -1,
    });

    res.status(200).json(purchases);
  } catch (error) {
    console.error("GET PURCHASES ERROR:", error);

    res.status(500).json({
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
    );

    if (!purchase) {
      return res.status(404).json({
        message: "Purchase not found",
      });
    }

    res.status(200).json(purchase);
  } catch (error) {
    console.error("GET PURCHASE ERROR:", error);

    res.status(500).json({
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

    if (
      !productId ||
      !purchaseDate ||
      !productName ||
      !supplierName
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    if (Number(rawCost) <= 0) {
      return res.status(400).json({
        message: "Raw cost must be greater than 0",
      });
    }

    if (Number(quantity) <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    // =================================================
    // CLOUDINARY IMAGE UPLOAD
    // =================================================
    let productImage = "";

    if (req.file) {
      const uploadedImage =
        await uploadToCloudinary(req.file.buffer);

      productImage = uploadedImage.secure_url;
    }

    // =================================================
    // CREATE PURCHASE
    // =================================================
    const purchase = await Purchase.create({
      productId: productId.trim(),
      purchaseDate,
      productName: productName.trim(),
      rawCost: Number(rawCost),
      supplierName: supplierName.trim(),
      quantity: Number(quantity),

      // Cloudinary URL
      productImage,

      totalExpense:
        Number(rawCost) * Number(quantity),
    });

    res.status(201).json({
      message: "Purchase added successfully",
      purchase,
    });
  } catch (error) {
    console.error("CREATE PURCHASE ERROR:", error);

    res.status(500).json({
      message: "Failed to create purchase",
      error: error.message,
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

    const purchase = await Purchase.findById(
      req.params.id
    );

    if (!purchase) {
      return res.status(404).json({
        message: "Purchase not found",
      });
    }

    // =================================================
    // UPDATE BASIC DATA
    // =================================================
    purchase.productId = productId?.trim();
    purchase.purchaseDate = purchaseDate;
    purchase.productName = productName?.trim();
    purchase.rawCost = Number(rawCost);
    purchase.supplierName = supplierName?.trim();
    purchase.quantity = Number(quantity);

    purchase.totalExpense =
      Number(rawCost) * Number(quantity);

    // =================================================
    // NEW IMAGE UPLOADED
    // =================================================
    if (req.file) {
      const oldImage = purchase.productImage;

      const uploadedImage =
        await uploadToCloudinary(req.file.buffer);

      purchase.productImage =
        uploadedImage.secure_url;

      // Delete old Cloudinary image
      if (oldImage) {
        await deleteFromCloudinary(oldImage);
      }
    }

    const updatedPurchase =
      await purchase.save();

    res.status(200).json({
      message: "Purchase updated successfully",
      purchase: updatedPurchase,
    });
  } catch (error) {
    console.error(
      "UPDATE PURCHASE ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to update purchase",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE PURCHASE
// =====================================================
const deletePurchase = async (req, res) => {
  try {
    const purchase =
      await Purchase.findByIdAndDelete(
        req.params.id
      );

    if (!purchase) {
      return res.status(404).json({
        message: "Purchase not found",
      });
    }

    // Delete Cloudinary image
    if (purchase.productImage) {
      await deleteFromCloudinary(
        purchase.productImage
      );
    }

    res.status(200).json({
      message: "Purchase deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE PURCHASE ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to delete purchase",
      error: error.message,
    });
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
};