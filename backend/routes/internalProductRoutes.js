const express = require("express");

const {
  verifyProducts,
} = require("../controllers/internalProductController");

const internalStockAuth = require("../middleware/internalStockMiddleware");

const router = express.Router();

// =====================================================
// VERIFY PRODUCTS
// POST /api/internal/products/verify
// =====================================================
//
// Used only by Vraj Creation public website backend.
//
// Authentication:
// x-internal-secret
// =====================================================

router.post(
  "/verify",
  internalStockAuth,
  verifyProducts
);

module.exports = router;