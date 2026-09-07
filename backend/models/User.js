const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // =====================================================
    // NAME
    // =====================================================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // EMAIL
    // =====================================================

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // =====================================================
    // PASSWORD
    // =====================================================

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },

    // =====================================================
    // ROLE
    // =====================================================

    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    // =====================================================
    // STATUS
    // =====================================================

    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending",
    },

    // =====================================================
    // PASSWORD RESET FIELDS (NEW)
    // =====================================================

    resetPasswordToken: {
      type: String,
    },

    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Unique email
userSchema.index(
  { email: 1 },
  { unique: true }
);

module.exports =
  mongoose.model("User", userSchema);