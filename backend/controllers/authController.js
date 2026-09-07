const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

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
// EMAIL CONFIG (NODEMAILER)
// =====================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
      if (user.status === "pending") {
        return res.status(403).json({
          success: false,
          message:
            "Aapka account abhi Admin dwara approve nahi hua hai. Kripya permission ka intezaar karein.",
        });
      }

      if (user.status === "rejected") {
        return res.status(403).json({
          success: false,
          message:
            "Aapka account reject kar diya gaya hai.",
        });
      }

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

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User authentication information missing",
      });
    }

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
    if (
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admin access required",
      });
    }

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
    if (
      req.user?.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Admin access required",
      });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required",
      });
    }

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

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found",
      });
    }

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
// FORGOT PASSWORD
// =====================================================

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const cleanEmail = (email || "").trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 Minutes
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request - Vraj Creation",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #8f3424;">Vraj Creation Security</h2>
          <p>Hello <b>${user.name}</b>,</p>
          <p>You requested a password reset. Click the button below to set a new password. This link is valid for 15 minutes:</p>
          <a href="${resetLink}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #8f3424; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Reset Password</a>
          <p style="margin-top: 20px; font-size: 12px; color: #777;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
};

// =====================================================
// RESET PASSWORD
// =====================================================

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  try {
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long.",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset link is invalid or has expired.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password has been successfully reset. You can now log in.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
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
  forgotPassword,
  resetPassword,
};