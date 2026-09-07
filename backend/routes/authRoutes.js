const express = require("express");

const {
  register,
  login,
  getProfile,
  forgotPassword, // 1. यहाँ जोड़े
  resetPassword,  // 2. यहाँ जोड़े
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// AUTH ROUTES
// =====================================================

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Profile
router.get("/profile", protect, getProfile);

// Forgot Password (यह नया राउट जोड़ा गया है)
router.post("/forgot-password", forgotPassword);

// Reset Password (यह नया राउट जोड़ा गया है)
router.post("/reset-password/:token", resetPassword);

module.exports = router;