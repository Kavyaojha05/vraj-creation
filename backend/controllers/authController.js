const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// =====================================================
// CONFIG
// =====================================================

const JWT_SECRET =
  process.env.JWT_SECRET ||
  "vraj_default_secure_secret_2026";

// =====================================================
// ADMIN EMAILS
// =====================================================
// In emails ko automatically admin access milega.

const ADMIN_EMAILS = [
  "pawan@gmail.com",
  "ojhavikas30@gmail.com",
  "kavyaojha05@gmail.com",
];

// =====================================================
// EMAIL VALIDATION
// =====================================================

const EMAIL_REGEX =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// =====================================================
// ADMIN CHECK HELPER
// =====================================================

const isAdminEmail = (email) => {
  if (!email) return false;

  return ADMIN_EMAILS.includes(
    email.trim().toLowerCase()
  );
};

// =====================================================
// GENERATE TOKEN
// =====================================================

const generateToken = (userId, role) => {
  return jwt.sign(
    {
      id: userId.toString(),
      role,
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// =====================================================
// REGISTER
// =====================================================

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
    } = req.body;

    // ===================================================
    // REQUIRED FIELDS
    // ===================================================

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // ===================================================
    // CLEAN DATA
    // ===================================================

    const cleanName = name.trim();

    const cleanEmail =
      email.trim().toLowerCase();

    // ===================================================
    // EMAIL VALIDATION
    // ===================================================

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide a valid email address",
      });
    }

    // ===================================================
    // PASSWORD VALIDATION
    // ===================================================

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters long",
      });
    }

    // ===================================================
    // CHECK EXISTING USER
    // ===================================================

    const existingUser =
      await User.findOne({
        email: cleanEmail,
      });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          "User already exists with this email",
      });
    }

    // ===================================================
    // HASH PASSWORD
    // ===================================================

    const hashedPassword =
      await bcrypt.hash(
        String(password),
        10
      );

    // ===================================================
    // CHECK FIRST USER
    // ===================================================

    const userCount =
      await User.countDocuments();

    const isFirstUser =
      userCount === 0;

    // ===================================================
    // CHECK ADMIN EMAIL
    // ===================================================

    const adminEmail =
      isAdminEmail(cleanEmail);

    // ===================================================
    // ASSIGN ROLE
    // ===================================================

    const role =
      isFirstUser || adminEmail
        ? "admin"
        : "user";

    // ===================================================
    // ASSIGN STATUS
    // ===================================================

    const status =
      isFirstUser || adminEmail
        ? "active"
        : "pending";

    // ===================================================
    // CREATE USER
    // ===================================================

    const user = await User.create({
      name: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      role,
      status,
    });

    // ===================================================
    // RESPONSE
    // ===================================================

    return res.status(201).json({
      success: true,

      message:
        role === "admin"
          ? "Admin account created successfully!"
          : "Registration successful! Admin approval ke baad aap login kar sakenge.",
    });
  } catch (error) {
    console.error(
      "REGISTER ERROR:",
      error
    );

    // ===================================================
    // DUPLICATE EMAIL
    // ===================================================

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Email already registered in system",
      });
    }

    // ===================================================
    // SERVER ERROR
    // ===================================================

    return res.status(500).json({
      success: false,
      message: "Registration failed",
      error: error.message,
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // ===================================================
    // REQUIRED FIELDS
    // ===================================================

    if (
      !email?.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required",
      });
    }

    // ===================================================
    // CLEAN EMAIL
    // ===================================================

    const cleanEmail =
      email.trim().toLowerCase();

    // ===================================================
    // FIND USER
    // ===================================================

    const user =
      await User.findOne({
        email: cleanEmail,
      }).select(
        "+password name email role status"
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // ===================================================
    // PASSWORD CHECK
    // ===================================================

    const passwordCorrect =
      await bcrypt.compare(
        String(password),
        user.password
      );

    if (!passwordCorrect) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid email or password",
      });
    }

    // ===================================================
    // ADMIN EMAIL AUTO-ACTIVATION
    // ===================================================
    // Agar email ADMIN_EMAILS mein hai,
    // to automatically admin + active bana do.

    const adminEmail =
      isAdminEmail(cleanEmail);

    if (adminEmail) {
      if (
        user.role !== "admin" ||
        user.status !== "active"
      ) {
        user.role = "admin";
        user.status = "active";

        await user.save();
      }
    }

    // ===================================================
    // ACCOUNT STATUS
    // ===================================================

    if (user.status !== "active") {
      // -------------------------------------------------
      // PENDING
      // -------------------------------------------------

      if (user.status === "pending") {
        return res.status(403).json({
          success: false,
          message:
            "Aapka account abhi Admin dwara approve nahi hua hai. Kripya permission ka intezaar karein.",
        });
      }

      // -------------------------------------------------
      // REJECTED
      // -------------------------------------------------

      if (user.status === "rejected") {
        return res.status(403).json({
          success: false,
          message:
            "Aapka account reject kar diya gaya hai.",
        });
      }

      // -------------------------------------------------
      // OTHER STATUS
      // -------------------------------------------------

      return res.status(403).json({
        success: false,
        message:
          "Account is not active",
      });
    }

    // ===================================================
    // GENERATE JWT
    // ===================================================

    const token =
      generateToken(
        user._id,
        user.role
      );

    // ===================================================
    // RESPONSE
    // ===================================================

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error(
      "LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Login service temporarily unavailable",
      error: error.message,
    });
  }
};

// =====================================================
// GET PROFILE
// =====================================================

const getProfile = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?._id;

    // ===================================================
    // AUTH CHECK
    // ===================================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication information missing",
      });
    }

    // ===================================================
    // FIND USER
    // ===================================================

    const user =
      await User.findById(userId)
        .select(
          "-password -__v"
        )
        .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User profile not found",
      });
    }

    // ===================================================
    // RESPONSE
    // ===================================================

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(
      "PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch profile",
    });
  }
};

// =====================================================
// GET PENDING USERS
// =====================================================

const getPendingUsers = async (
  req,
  res
) => {
  try {
    // ===================================================
    // ADMIN CHECK
    // ===================================================

    if (
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admin access required",
      });
    }

    // ===================================================
    // GET PENDING USERS
    // ===================================================

    const pendingUsers =
      await User.find({
        status: "pending",
      })
        .select(
          "name email createdAt role status"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    // ===================================================
    // RESPONSE
    // ===================================================

    return res.status(200).json({
      success: true,
      count: pendingUsers.length,
      users: pendingUsers,
    });
  } catch (error) {
    console.error(
      "GET PENDING USERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch pending users",
      error: error.message,
    });
  }
};

// =====================================================
// APPROVE USER
// =====================================================

const approveUser = async (
  req,
  res
) => {
  try {
    // ===================================================
    // ADMIN CHECK
    // ===================================================

    if (
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admin access required",
      });
    }

    // ===================================================
    // GET USER ID
    // ===================================================

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required",
      });
    }

    // ===================================================
    // APPROVE USER
    // ===================================================

    const user =
      await User.findByIdAndUpdate(
        id,
        {
          status: "active",
        },
        {
          new: true,
          runValidators: true,
        }
      ).select(
        "name email status role"
      );

    // ===================================================
    // USER NOT FOUND
    // ===================================================

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

    // ===================================================
    // RESPONSE
    // ===================================================

    return res.status(200).json({
      success: true,

      message:
        `User ${user.name} approved successfully!`,

      user,
    });
  } catch (error) {
    console.error(
      "APPROVE USER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to approve user",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  register,
  login,
  getProfile,
  getPendingUsers,
  approveUser,
};