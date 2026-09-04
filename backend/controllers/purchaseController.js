const Purchase = require("../models/Purchase");

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
      message: "Failed to fetch purchases",
      error: error.message,
    });
  }
};

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
      message: "Failed to fetch purchase",
      error: error.message,
    });
  }
};

// ==========================================
// CREATE PURCHASE (DIRECT INSERT - NO OBJECTID CRASH)
// ==========================================
const createPurchase = async (req, res) => {
  try {
    const {
      productId,
      purchaseDate,
      productName,
      rawCost,
      supplierName,
      quantity,
      productImage,
    } = req.body;

    if (!productId || !purchaseDate || !productName || !supplierName) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

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
      message: "Purchase added successfully",
      purchase,
    });
  } catch (error) {
    console.error("CREATE PURCHASE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create purchase",
    });
  }
};

// ==========================================
// UPDATE PURCHASE (SAFE UPDATE - NO CRASH)
// ==========================================
const updatePurchase = async (req, res) => {
  try {
    const {
      productId,
      purchaseDate,
      productName,
      rawCost,
      supplierName,
      quantity,
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
      message: "Purchase updated successfully",
      purchase: updatedPurchase,
    });
  } catch (error) {
    console.error("UPDATE PURCHASE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update purchase",
    });
  }
};

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