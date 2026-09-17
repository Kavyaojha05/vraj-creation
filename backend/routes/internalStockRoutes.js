const express = require("express");

const {
  decreaseStock,
  increaseStock,
} = require("../controllers/internalStockController");

const internalStockAuth = require("../middleware/internalStockMiddleware");

const router = express.Router();

// =====================================================
// DECREASE STOCK
// POST /api/internal/stock/decrease
// =====================================================

router.post(
  "/decrease",
  internalStockAuth,
  decreaseStock
);

// =====================================================
// INCREASE STOCK - ROLLBACK
// POST /api/internal/stock/increase
// =====================================================

router.post(
  "/increase",
  internalStockAuth,
  increaseStock
);

module.exports = router;