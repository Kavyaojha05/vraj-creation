// =====================================================
// VRAJ CREATION - OTHER EXPENSE ROUTES
// =====================================================

const express = require("express");

const router = express.Router();

// =====================================================
// IMAGE UPLOAD MIDDLEWARE
// =====================================================

const upload =
  require("../middleware/otherExpenseUpload");

// =====================================================
// CONTROLLER
// =====================================================

const {
  uploadOtherExpenseImage,
  addOtherExpense,
  getOtherExpenses,
  getOtherExpenseById,
  updateOtherExpense,
  deleteOtherExpense,
} = require("../controllers/otherExpenseController");

// =====================================================
// UPLOAD IMAGE
// =====================================================
//
// POST
// /api/other-expenses/upload-image
//
// FormData field:
// image
//
// =====================================================

router.post(
  "/upload-image",
  upload.single("image"),
  uploadOtherExpenseImage
);

// =====================================================
// CREATE OTHER EXPENSE
// =====================================================
//
// POST
// /api/other-expenses
//
// =====================================================

router.post(
  "/",
  addOtherExpense
);

// =====================================================
// GET ALL OTHER EXPENSES
// =====================================================
//
// GET
// /api/other-expenses
//
// =====================================================

router.get(
  "/",
  getOtherExpenses
);

// =====================================================
// GET SINGLE OTHER EXPENSE
// =====================================================
//
// GET
// /api/other-expenses/:id
//
// =====================================================

router.get(
  "/:id",
  getOtherExpenseById
);

// =====================================================
// UPDATE OTHER EXPENSE
// =====================================================
//
// PUT
// /api/other-expenses/:id
//
// =====================================================

router.put(
  "/:id",
  updateOtherExpense
);

// =====================================================
// DELETE OTHER EXPENSE
// =====================================================
//
// DELETE
// /api/other-expenses/:id
//
// =====================================================

router.delete(
  "/:id",
  deleteOtherExpense
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;