const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const DUMMY_HASH = "$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateToken = (userId, userRole = "user") => {
  const secret = process.env.JWT_SECRET || "vraj_default_secure_secret_2026";
  return jwt.sign(
    {
      id: userId.toString(),
      role: userRole,
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
};

// =========================
// Register (Pending Approval)
// =========================
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    const existingUser = await User.findOne({ email: cleanEmail }).select("_id").lean();
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Agar database mein ek bhi user nahi hai, toh pehla user automatically Admin & Active ban jayega
    const userCount = await User.countDocuments();
    const initialStatus = userCount === 0 ? "active" : "pending";
    const initialRole = userCount === 0 ? "admin" : "user";

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role: initialRole,
      status: initialStatus,
    });

    return res.status(201).json({
      success: true,
      message:
        userCount === 0
          ? "First admin account created successfully!"
          : "Registration successful! Admin approval ke baad aap login kar sakenge.",
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already registered in system",
      });
    }
    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// =========================
// Login (Status Check Added)
// =========================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail })
      .select("+password name email role status")
      .lean();

    const passwordToCompare = user?.password || DUMMY_HASH;
    const isPasswordCorrect = await bcrypt.compare(String(password), passwordToCompare);

    if (!user || !isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // CHECK: Kya account Admin dwara active kiya gaya hai?
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Aapka account abhi Admin dwara approve nahi hua hai. Kripya permission ka intezaar karein.",
      });
    }

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Login service temporarily unavailable",
      error: error.message,
    });
  }
};

// =========================
// Get Profile
// =========================
const getProfile = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const user = await User.findById(userId).select("-password -__v").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

// =========================
// Get Pending Users (Admin)
// =========================
const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" })
      .select("name email createdAt role")
      .lean();

    return res.status(200).json({
      success: true,
      users: pendingUsers,
    });
  } catch (error) {
    console.error("GET PENDING USERS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending users",
    });
  }
};

// =========================
// Approve User (Admin)
// =========================
const approveUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(
      id,
      { status: "active" },
      { new: true }
    ).select("name email status role");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User ${user.name} approved successfully!`,
      user,
    });
  } catch (error) {
    console.error("APPROVE USER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve user",
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  getPendingUsers,
  approveUser,
};