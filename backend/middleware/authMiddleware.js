const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    // =====================================================
    // GET AUTHORIZATION HEADER
    // =====================================================

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token missing.",
      });
    }

    // =====================================================
    // GET TOKEN
    // =====================================================

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Token missing.",
      });
    }

    // =====================================================
    // JWT SECRET
    // =====================================================

    const secret =
      process.env.JWT_SECRET || "vraj_default_secure_secret_2026";

    // =====================================================
    // VERIFY TOKEN
    // =====================================================

    const decoded = jwt.verify(token, secret);

    // =====================================================
    // SAVE USER DATA
    // =====================================================

    req.user = decoded;

    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = protect;