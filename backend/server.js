const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

dotenv.config();

const connectDB = require("./config/db");

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const saleRoutes = require("./routes/saleRoutes");
const billRoutes = require("./routes/billRoutes");



const app = express();

// =====================================================
// DATABASE
// =====================================================

connectDB();

// =====================================================
// PERFORMANCE
// =====================================================

app.use(compression());

// =====================================================
// CORS
// =====================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// =====================================================
// BODY PARSER
// =====================================================

app.use(
  express.json({
    limit: "15mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "15mb",
  })
);

// =====================================================
// LOGIN RATE LIMIT
// =====================================================

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,

  message: {
    success: false,
    message:
      "Too many login attempts. Please try again after 15 minutes.",
  },

  standardHeaders: true,
  legacyHeaders: false,
});

app.use(
  "/api/auth/login",
  loginLimiter
);

// =====================================================
// UPLOADS
// =====================================================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads"),
    {
      maxAge: "1d",
    }
  )
);

// =====================================================
// API ROUTES
// =====================================================

// Authentication (Includes Login, Register, Forgot & Reset Password)
app.use(
  "/api/auth",
  authRoutes
);

// Users / Admin approval
app.use(
  "/api/users",
  userRoutes
);
app.use("/api/bills", billRoutes);

// Products
app.use(
  "/api/products",
  productRoutes
);

// Purchases
app.use(
  "/api/purchases",
  purchaseRoutes
);

// Sales
app.use(
  "/api/sales",
  saleRoutes
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
  "/api/health",
  (req, res) => {
    res.status(200).json({
      success: true,
      status: "OK",
      message:
        "Vraj Creation API is running",
    });
  }
);

// =====================================================
// 404
// =====================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,
      message: "API route not found",
      path: req.originalUrl,
    });
  }
);

// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
  (err, req, res, next) => {
    console.error(
      "SERVER ERROR:",
      err
    );

    if (
      err.type === "entity.too.large"
    ) {
      return res.status(413).json({
        success: false,
        message:
          "Image/file is too large. Maximum allowed size is 15MB.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Internal server error",
      error: err.message,
    });
  }
);

// =====================================================
// SERVER
// =====================================================

const PORT =
  process.env.PORT || 5000;

app.listen(
  PORT,
  () => {
    console.log(
      `Server running on port ${PORT}`
    );
  }
);