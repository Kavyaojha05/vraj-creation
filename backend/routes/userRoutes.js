const express = require("express");
const router = express.Router();
const {
  getPendingUsers,
  approveUser,
} = require("../controllers/authController");

// Routes
router.get("/pending", getPendingUsers);
router.put("/approve/:id", approveUser);

module.exports = router; // <-- Yahan 'module.exports' hona zaroori hai (model.exports nahi)