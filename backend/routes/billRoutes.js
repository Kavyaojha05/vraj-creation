const express = require("express");

const {
  generateBill,
  getAllBills,
  getBillById,
  updateBill,
  deleteBill,
} = require("../controllers/billController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE
router.post(
  "/generate",
  protect,
  generateBill
);

// GET ALL
router.get(
  "/",
  protect,
  getAllBills
);

// GET SINGLE
router.get(
  "/:id",
  protect,
  getBillById
);

// UPDATE
router.put(
  "/:id",
  protect,
  updateBill
);

// DELETE
router.delete(
  "/:id",
  protect,
  deleteBill
);

module.exports = router;