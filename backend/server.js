const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const saleRoutes = require("./routes/saleRoutes");

const app = express();

// ==============================
// MongoDB
// ==============================
connectDB();

// ==============================
// Middleware
// ==============================
app.use(cors());

// IMPORTANT:
// Purchase image Base64 ke liye JSON limit badhai gayi hai
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ==============================
// Uploads
// ==============================
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// ==============================
// Routes
// ==============================
app.use("/api/auth", authRoutes);
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
      message: "Image/file is too large. Maximum allowed size is 10MB.",
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