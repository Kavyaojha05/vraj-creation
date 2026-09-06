const express = require("express");

const {
  getPendingUsers,
  approveUser,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// ADMIN USER APPROVAL ROUTES
// =====================================================

// Get all pending users
router.get("/pending", protect, getPendingUsers);

// Approve pending user
router.put("/approve/:id", protect, approveUser);

module.exports = router;