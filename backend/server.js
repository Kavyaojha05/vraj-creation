const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const saleRoutes = require("./routes/saleRoutes");

const app = express();

// ==============================
// MongoDB
// ==============================
connectDB();

// ==============================
// Performance Optimization (Speed Boost)
// ==============================
app.use(compression());

// ==============================
// Middleware
// ==============================
app.use(cors());

// Purchase/Product image Base64 ke liye JSON limit
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ==============================
// Security - Rate Limiting (Login Protection)
// ==============================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", loginLimiter);

// ==============================
// Uploads
// ==============================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "1d",
  })
);

// ==============================
// Routes
// ==============================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);

// ==============================
// Health Check
// ==============================
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Vraj Creation API is running",
  });
});

// ==============================
// 404
// ==============================
app.use((req, res) => {
  res.status(404).json({
    message: "API route not found",
    path: req.originalUrl,
  });
});

// ==============================
// Error Handler
// ==============================
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      message: "Image/file is too large. Maximum allowed size is 15MB.",
    });
  }

  res.status(500).json({
    message: "Internal server error",
    error: err.message,
  });
});

// ==============================
// Server
// ==============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});