const express = require("express");

<<<<<<< HEAD
=======
const router = express.Router();

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
} = require("../controllers/purchaseController");

<<<<<<< HEAD
const router = express.Router();

// GET all
router.get("/", getPurchases);

// GET single
router.get("/:id", getPurchaseById);

// POST
router.post("/", createPurchase);

// PUT
router.put("/:id", updatePurchase);

// DELETE
=======
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
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
router.delete("/:id", deletePurchase);

module.exports = router;