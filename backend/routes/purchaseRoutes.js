const express = require("express");

const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
} = require("../controllers/purchaseController");

const upload = require("../middleware/upload");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// GET ALL PURCHASES
// =====================================================
router.get("/", protect, getPurchases);

// =====================================================
// GET SINGLE PURCHASE
// =====================================================
router.get("/:id", protect, getPurchaseById);

// =====================================================
// CREATE PURCHASE
// Image field name = imageFile
// Product stock will increase automatically
// =====================================================
router.post(
  "/",
  protect,
  upload.single("imageFile"),
  createPurchase
);

// =====================================================
// UPDATE PURCHASE
// Image field name = imageFile
// Product stock will be adjusted automatically
// =====================================================
router.put(
  "/:id",
  protect,
  upload.single("imageFile"),
  updatePurchase
);

// =====================================================
// DELETE PURCHASE
// Product stock will decrease automatically
// =====================================================
router.delete(
  "/:id",
  protect,
  deletePurchase
);

module.exports = router;