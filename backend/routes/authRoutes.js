const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getProfile,
  getPendingUsers,
  approveUser,
} = require("../controllers/authController");

// Agar aapke paas auth middleware hai toh yahan import kar sakte hain
// const { protect, adminOnly } = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", getProfile); // Isme protect middleware jod sakte hain agar zaroorat ho

// Admin Approval Routes
router.get("/pending-users", getPendingUsers);
router.put("/approve-user/:id", approveUser);

module.exports = router;