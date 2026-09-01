const Purchase = require("../models/Purchase");

// ==============================
// GET ALL PURCHASES
// ==============================
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

// ==============================
// GET SINGLE PURCHASE
// ==============================
const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);

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

// ==============================
// CREATE PURCHASE
// ==============================
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

    const purchase = await Purchase.create({
      productId: productId.trim(),
      purchaseDate,
      productName: productName.trim(),
      rawCost: Number(rawCost),
      supplierName: supplierName.trim(),
      quantity: Number(quantity),
      productImage: productImage || "",
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

// ==============================
// UPDATE PURCHASE
// ==============================
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

    const purchase = await Purchase.findById(
      req.params.id
    );

    if (!purchase) {
      return res.status(404).json({
        message: "Purchase not found",
      });
    }

    purchase.productId = productId;
    purchase.purchaseDate = purchaseDate;
    purchase.productName = productName;
    purchase.rawCost = Number(rawCost);
    purchase.supplierName = supplierName;
    purchase.quantity = Number(quantity);
    purchase.productImage = productImage || "";

    purchase.totalExpense =
      Number(rawCost) * Number(quantity);

    const updatedPurchase = await purchase.save();

    res.status(200).json({
      message: "Purchase updated successfully",
      purchase: updatedPurchase,
    });
  } catch (error) {
    console.error("UPDATE PURCHASE ERROR:", error);

    res.status(500).json({
      message: "Failed to update purchase",
      error: error.message,
    });
  }
};

// ==============================
// DELETE PURCHASE
// ==============================
const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findByIdAndDelete(
      req.params.id
    );

    if (!purchase) {
      return res.status(404).json({
        message: "Purchase not found",
      });
    }

    res.status(200).json({
      message: "Purchase deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PURCHASE ERROR:", error);

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