const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
<<<<<<< HEAD
=======

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
<<<<<<< HEAD
      index: true,
    },
=======
    },

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
    password: {
      type: String,
      required: true,
      minlength: 6,
<<<<<<< HEAD
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["pending", "active", "rejected"],
      default: "pending", // Jab tak admin approve na kare tab tak pending rahega
=======
    },

    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
    },
  },
  {
    timestamps: true,
<<<<<<< HEAD
    versionKey: false,
  }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
=======
  }
);
module.exports = mongoose.model("User", userSchema);
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
