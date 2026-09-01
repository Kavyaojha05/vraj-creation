const express = require("express");
const Sale = require("../models/Sale");

const router = express.Router();

// ==============================
// GET ALL SALES
// ==============================
router.get("/", async (req, res) => {
  try {
    const sales = await Sale.find().sort({ createdAt: -1 });

    res.json(sales);
  } catch (error) {
    console.error("GET SALES ERROR:", error);

    res.status(500).json({
      message: "Failed to fetch sales",
      error: error.message,
    });
  }
});

// ==============================
// ADD SALE
// ==============================
router.post("/", async (req, res) => {
  try {
    console.log("SALE REQUEST:", req.body);

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

    // Required fields
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
      platform: String(platform).toLowerCase(),
      date,
      quantity: Number(quantity),
      bankSettlementAmount: Number(bankSettlementAmount),
      packagingCost: Number(packagingCost || 0),
      colouringCost: Number(colouringCost || 0),
    });

    const savedSale = await sale.save();

    console.log("SALE SAVED:", savedSale._id);

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
// UPDATE SALE
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

    const sale = await Sale.findByIdAndUpdate(
      req.params.id,
      {
        productId,
        productName,
        productImage: productImage || "",
        platform: String(platform).toLowerCase(),
        date,
        quantity: Number(quantity),
        bankSettlementAmount: Number(bankSettlementAmount),
        packagingCost: Number(packagingCost || 0),
        colouringCost: Number(colouringCost || 0),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    res.json({
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

    res.json({
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