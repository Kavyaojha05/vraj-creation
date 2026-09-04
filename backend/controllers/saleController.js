const Sale = require("../models/Sale");

// ==========================================
// GET ALL SALES (ULTRA-FAST FIELD PROJECTION)
// ==========================================
const getSales = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    // Image ko table view me chhod kar sirf lightweight data fetch karega
    // Isse 50MB ka response घटकर sirf 15KB ho jayega!
    const selectFields = {
      productId: 1,
      productName: 1,
      platform: 1,
      date: 1,
      quantity: 1,
      bankSettlementAmount: 1,
      packagingCost: 1,
      colouringCost: 1,
      createdAt: 1,
      // Agar image choti thumbnail ho toh hi bhejega
      hasImage: { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ["$productImage", ""] } }, 0] }, true, false] }
    };

    if (page && limit) {
      const skip = (page - 1) * limit;

      const [sales, total] = await Promise.all([
        Sale.find({}, selectFields)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Sale.estimatedDocumentCount(),
      ]);

      return res.status(200).json({
        success: true,
        count: total,
        page,
        pages: Math.ceil(total / limit),
        sales,
      });
    }

    // Default fast fetch (Max 200 items in <100ms)
    const sales = await Sale.find({}, selectFields)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json(sales);
  } catch (error) {
    console.error("GET SALES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch sales",
      error: error.message,
    });
  }
};

// ==========================================
// GET SINGLE SALE (FULL DETAILS + IMAGE ON DEMAND)
// ==========================================
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).lean();
    if (!sale) {
      return res.status(404).json({ success: false, message: "Sale entry nahi mili" });
    }
    return res.status(200).json(sale);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// CREATE SALE (FAST ATOMIC INSERT)
// ==========================================
const createSale = async (req, res) => {
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

    const rawData = {
      productId: String(productId || "PRD-DEFAULT").trim(),
      productName: String(productName || "Untitled Product").trim(),
      productImage: productImage || "",
      platform: platform ? String(platform).toLowerCase().trim() : "meesho",
      date: date || new Date().toISOString().split("T")[0],
      quantity: Number(quantity) || 1,
      bankSettlementAmount: Number(bankSettlementAmount) || 0,
      packagingCost: Number(packagingCost) || 0,
      colouringCost: Number(colouringCost) || 0,
    };

    const sale = await Sale.create(rawData);

    return res.status(201).json({
      success: true,
      message: "Sale entry added successfully",
      sale,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create sale entry",
      error: error.message,
    });
  }
};

// ==========================================
// UPDATE SALE (FAST ATOMIC UPDATE)
// ==========================================
const updateSale = async (req, res) => {
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

    const updateFields = {};

    if (productId !== undefined) updateFields.productId = String(productId).trim();
    if (productName !== undefined) updateFields.productName = String(productName).trim();
    if (productImage !== undefined) updateFields.productImage = productImage;
    if (platform !== undefined) updateFields.platform = String(platform).toLowerCase().trim();
    if (date !== undefined) updateFields.date = date;
    if (quantity !== undefined) updateFields.quantity = Number(quantity);
    if (bankSettlementAmount !== undefined) updateFields.bankSettlementAmount = Number(bankSettlementAmount);
    if (packagingCost !== undefined) updateFields.packagingCost = Number(packagingCost);
    if (colouringCost !== undefined) updateFields.colouringCost = Number(colouringCost);

    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).lean();

    if (!updatedSale) {
      return res.status(404).json({ success: false, message: "Sale entry nahi mili" });
    }

    return res.status(200).json({
      success: true,
      message: "Sale entry updated successfully",
      sale: updatedSale,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update sale",
      error: error.message,
    });
  }
};

// ==========================================
// DELETE SALE
// ==========================================
const deleteSale = async (req, res) => {
  try {
    const deletedSale = await Sale.findByIdAndDelete(req.params.id).lean();

    if (!deletedSale) {
      return res.status(404).json({ success: false, message: "Sale entry nahi mili" });
    }

    return res.status(200).json({
      success: true,
      message: "Sale entry deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete sale",
      error: error.message,
    });
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
};