const express = require("express");
const Sale = require("../models/Sale");

const router = express.Router();

// ==============================
// GET ALL SALES (FAST WITH LEAN)
// ==============================
router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find()
      .sort({ createdAt: -1 })
      .lean(); // Response fast karne ke liye

    res.status(200).json(sales);
  } catch (error) {
    console.error("GET SALES ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch sales",
      error: error.message,
    });
  }
});

// ==============================
// ADD SALE (DIRECT ENTRY)
// ==============================
router.post("/", async (req, res) => {
  try {
    const {
      productId,
      productName,
      productImage,
      platform,
      date,
      quantity,
      bankSettlementAmount,
      packagingCost,
      colouringCost,
    } = req.body;

    if (
      !productId ||
      !productName ||
      !platform ||
      !date ||
      quantity === undefined ||
      quantity === "" ||
      bankSettlementAmount === undefined ||
      bankSettlementAmount === ""
    ) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const sale = new Sale({
      productId: String(productId).trim(),
      productName: String(productName).trim(),
      productImage: productImage || "",
      platform: String(platform).toLowerCase().trim(),
      date,
      quantity: Number(quantity) || 1,
      bankSettlementAmount: Number(bankSettlementAmount) || 0,
      packagingCost: Number(packagingCost || 0),
      colouringCost: Number(colouringCost || 0),
    });

    const savedSale = await sale.save();

    res.status(201).json({
      message: "Sale added successfully",
      sale: savedSale,
    });
  } catch (error) {
    console.error("ADD SALE ERROR:", error);

    res.status(500).json({
      message: "Failed to add sale",
      error: error.message,
    });
  }
});

// ==============================
// UPDATE SALE (DIRECT EDIT - NO VALIDATION CRASH)
// ==============================
router.put("/:id", async (req, res) => {
  try {
    const {
      productId,
      productName,
      productImage,
      platform,
      date,
      quantity,
      bankSettlementAmount,
      packagingCost,
      colouringCost,
    } = req.body;

    const updateData = {};

    if (productId !== undefined) updateData.productId = String(productId).trim();
    if (productName !== undefined) updateData.productName = String(productName).trim();
    if (productImage !== undefined) updateData.productImage = productImage;
    if (platform !== undefined) updateData.platform = String(platform).toLowerCase().trim();
    if (date !== undefined) updateData.date = date;
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (bankSettlementAmount !== undefined) updateData.bankSettlementAmount = Number(bankSettlementAmount);
    if (packagingCost !== undefined) updateData.packagingCost = Number(packagingCost);
    if (colouringCost !== undefined) updateData.colouringCost = Number(colouringCost);

    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      {
        new: true,
        runValidators: false, // Strict model hook bypass karega taaki crash na ho
      }
    );

    if (!sale) {
      return res.status(404).json({
        message: "Sale record not found",
      });
    }

    res.status(200).json({
      message: "Sale updated successfully",
      sale,
    });
  } catch (error) {
    console.error("UPDATE SALE ERROR:", error);

    res.status(500).json({
      message: "Failed to update sale",
      error: error.message,
    });
  }
});

// ==============================
// DELETE SALE
// ==============================
router.delete("/:id", async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    res.status(200).json({
      message: "Sale deleted successfully",
    });
  } catch (error) {
    console.error("DELETE SALE ERROR:", error);

    res.status(500).json({
      message: "Failed to delete sale",
      error: error.message,
    });
  }
});

module.exports = router;