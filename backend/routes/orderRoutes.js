const express = require("express");

const {
  createOrder,
  getOrderByNumber,
  getAllOrders,
} = require("../controllers/orderController");

const router = express.Router();

// =====================================================
// GET ALL ORDERS
// =====================================================

router.get(
  "/",
  getAllOrders
);

// =====================================================
// CREATE ORDER
// =====================================================

router.post(
  "/",
  createOrder
);

// =====================================================
// GET ORDER BY ORDER NUMBER
// =====================================================

router.get(
  "/:orderNumber",
  getOrderByNumber
);

module.exports = router;