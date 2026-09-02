const express = require("express");

const {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
} = require("../controllers/saleController");

const upload = require("../middleware/upload");

const router = express.Router();

// ===============================
// GET ALL SALES
// ===============================
router.get("/", getSales);

// ===============================
// GET SALE BY ID
// ===============================
router.get("/:id", getSaleById);

// ===============================
// CREATE SALE
// ===============================
router.post(
  "/",
  upload.single("productImage"),
  createSale
);

// ===============================
// UPDATE SALE
// ===============================
router.put(
  "/:id",
  upload.single("productImage"),
  updateSale
);

// ===============================
// DELETE SALE
// ===============================
router.delete(
  "/:id",
  deleteSale
);

module.exports = router;