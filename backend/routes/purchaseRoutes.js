const express = require("express");

const {
  getPurchases,
  getPurchaseById,
  createPurchase,
  updatePurchase,
  deletePurchase,
} = require("../controllers/purchaseController");

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
router.delete("/:id", deletePurchase);

module.exports = router;