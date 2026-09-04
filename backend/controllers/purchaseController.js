const Purchase = require("../models/Purchase");
<<<<<<< HEAD

// ==========================================
// GET ALL PURCHASES (FAST LEAN FETCH + PAGINATION)
// ==========================================
const getPurchases = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    // Agar query me page aur limit aaye toh pagination karega
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

    // Default fast fetch
    const purchases = await Purchase.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(purchases);
  } catch (error) {
    console.error("GET PURCHASES ERROR:", error);
    return res.status(500).json({
      success: false,
=======
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
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      message: "Failed to fetch purchases",
      error: error.message,
    });
  }
};

<<<<<<< HEAD
// ==========================================
// GET SINGLE PURCHASE
// ==========================================
const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id).lean();

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
=======
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
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      message: "Failed to fetch purchase",
      error: error.message,
    });
  }
};

<<<<<<< HEAD
// ==========================================
// CREATE PURCHASE (DIRECT INSERT - NO OBJECTID CRASH)
// ==========================================
=======
// =====================================================
// CREATE PURCHASE
// =====================================================
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
const createPurchase = async (req, res) => {
  try {
    const {
      productId,
      purchaseDate,
      productName,
      rawCost,
      supplierName,
      quantity,
<<<<<<< HEAD
      productImage,
    } = req.body;

    if (!productId || !purchaseDate || !productName || !supplierName) {
      return res.status(400).json({
        success: false,
=======
    } = req.body;

    if (
      !productId ||
      !purchaseDate ||
      !productName ||
      !supplierName
    ) {
      return res.status(400).json({
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
        message: "Please fill all required fields",
      });
    }

<<<<<<< HEAD
    const costNum = Number(rawCost);
    const qtyNum = Number(quantity);

    if (Number.isNaN(costNum) || costNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Raw cost must be a valid number greater than 0",
      });
    }

    if (Number.isNaN(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a valid number greater than 0",
      });
    }

    // Direct Purchase collection insert bina Product table check kiye
    const purchase = await Purchase.create({
      productId: String(productId).trim(),
      purchaseDate: String(purchaseDate),
      productName: String(productName).trim(),
      rawCost: costNum,
      supplierName: String(supplierName).trim(),
      quantity: qtyNum,
      productImage: productImage || "",
      totalExpense: costNum * qtyNum,
    });

    return res.status(201).json({
      success: true,
=======
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
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      message: "Purchase added successfully",
      purchase,
    });
  } catch (error) {
    console.error("CREATE PURCHASE ERROR:", error);
<<<<<<< HEAD
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create purchase",
=======

    res.status(500).json({
      message: "Failed to create purchase",
      error: error.message,
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
    });
  }
};

<<<<<<< HEAD
// ==========================================
// UPDATE PURCHASE (SAFE UPDATE - NO CRASH)
// ==========================================
=======
// =====================================================
// UPDATE PURCHASE
// =====================================================
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
const updatePurchase = async (req, res) => {
  try {
    const {
      productId,
      purchaseDate,
      productName,
      rawCost,
      supplierName,
      quantity,
<<<<<<< HEAD
      productImage,
    } = req.body;

    const costNum = Number(rawCost);
    const qtyNum = Number(quantity);

    if (Number.isNaN(costNum) || costNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Raw cost must be greater than 0",
      });
    }

    if (Number.isNaN(qtyNum) || qtyNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const updateData = {
      productId: String(productId).trim(),
      purchaseDate: String(purchaseDate),
      productName: String(productName).trim(),
      rawCost: costNum,
      supplierName: String(supplierName).trim(),
      quantity: qtyNum,
      productImage: productImage || "",
      totalExpense: costNum * qtyNum,
    };

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (!updatedPurchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase entry not found",
      });
    }

    return res.status(200).json({
      success: true,
=======
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
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      message: "Purchase updated successfully",
      purchase: updatedPurchase,
    });
  } catch (error) {
<<<<<<< HEAD
    console.error("UPDATE PURCHASE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update purchase",
=======
    console.error(
      "UPDATE PURCHASE ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to update purchase",
      error: error.message,
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
    });
  }
};

<<<<<<< HEAD
// ==========================================
// DELETE PURCHASE
// ==========================================
const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(req.params.id);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase entry not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Purchase deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PURCHASE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete purchase",
=======
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
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
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