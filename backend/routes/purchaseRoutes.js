const express = require("express");

const router = express.Router();

const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
} = require("../controllers/purchaseController");

const upload = require("../middleware/upload");

// =====================================================
// GET ALL PURCHASES
// =====================================================
router.get("/", getPurchases);

// =====================================================
// GET SINGLE PURCHASE
// =====================================================
router.get("/:id", getPurchaseById);

// =====================================================
// CREATE PURCHASE
// Image field name = imageFile
// =====================================================
router.post(
  "/",
  upload.single("imageFile"),
  createPurchase
);

// =====================================================
// UPDATE PURCHASE
// Image field name = imageFile
// =====================================================
router.put(
  "/:id",
  upload.single("imageFile"),
  updatePurchase
);

// =====================================================
// DELETE PURCHASE
// =====================================================
router.delete("/:id", deletePurchase);

module.exports = router;