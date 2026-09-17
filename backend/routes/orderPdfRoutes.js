
const express = require("express");

const {
  generateCustomerPdf,
  generateAdminPdf,
} = require("../controllers/orderPdfController");

const router = express.Router();

// =====================================================
// CUSTOMER PDF
// =====================================================

router.get(
  "/:orderNumber/customer",
  generateCustomerPdf
);

// =====================================================
// ADMIN PDF
// =====================================================

router.get(
  "/:orderNumber/admin",
  generateAdminPdf
);

module.exports = router;