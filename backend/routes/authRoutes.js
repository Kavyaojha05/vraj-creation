const express = require("express");
<<<<<<< HEAD
const router = express.Router();
=======

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
const {
  register,
  login,
  getProfile,
<<<<<<< HEAD
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
=======
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", protect, getProfile);
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7

module.exports = router;