const express = require("express");

const {
  register,
  login,
  getProfile,
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

module.exports = router;