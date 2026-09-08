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
// GET /api/purchases
// =====================================================
router.get("/", protect, getPurchases);

// =====================================================
// GET SINGLE PURCHASE
// GET /api/purchases/:id
// =====================================================
router.get("/:id", protect, getPurchaseById);

// =====================================================
// CREATE PURCHASE
// POST /api/purchases
//
// FormData:
// imageFile -> image
//
// Product stock will increase automatically.
// =====================================================
router.post(
  "/",
  protect,
  upload.single("imageFile"),
  createPurchase
);

// =====================================================
// UPDATE PURCHASE
// PUT /api/purchases/:id
//
// FormData:
// imageFile -> optional new image
//
// If imageFile is not provided,
// existing image will remain unchanged.
//
// Product stock will be adjusted automatically.
// =====================================================
router.put(
  "/:id",
  protect,
  upload.single("imageFile"),
  updatePurchase
);

// =====================================================
// DELETE PURCHASE
// DELETE /api/purchases/:id
//
// Product stock will decrease automatically.
// =====================================================
router.delete(
  "/:id",
  protect,
  deletePurchase
);

module.exports = router;