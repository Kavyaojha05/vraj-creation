// =====================================================
// VRAJ CREATION - OTHER EXPENSE CONTROLLER
// =====================================================

const OtherExpense = require("../models/OtherExpense");
const cloudinary = require("../config/cloudinary");

// =====================================================
// CLOUDINARY UPLOAD HELPER
// =====================================================

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder: "vraj-creation/other-expenses",
          resource_type: "image",
        },

        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

    stream.end(buffer);
  });
};

// =====================================================
// DELETE CLOUDINARY IMAGE
// =====================================================

const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (!imageUrl) {
      return;
    }

    // -------------------------------------------------
    // Cloudinary URL se public_id identify karne ki
    // koshish.
    // -------------------------------------------------

    if (!imageUrl.includes("cloudinary.com")) {
      return;
    }

    const uploadIndex =
      imageUrl.indexOf("/upload/");

    if (uploadIndex === -1) {
      return;
    }

    let publicIdWithExtension =
      imageUrl.substring(
        uploadIndex + "/upload/".length
      );

    // Version remove
    publicIdWithExtension =
      publicIdWithExtension.replace(
        /^v\d+\//,
        ""
      );

    // Extension remove
    const lastDot =
      publicIdWithExtension.lastIndexOf(".");

    if (lastDot !== -1) {
      publicIdWithExtension =
        publicIdWithExtension.substring(
          0,
          lastDot
        );
    }

    await cloudinary.uploader.destroy(
      publicIdWithExtension,
      {
        resource_type: "image",
      }
    );
  } catch (error) {
    console.error(
      "Cloudinary Delete Error:",
      error.message
    );
  }
};

// =====================================================
// UPLOAD OTHER EXPENSE IMAGE
// =====================================================

const uploadOtherExpenseImage = async (
  req,
  res
) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image.",
      });
    }

    const result =
      await uploadToCloudinary(
        req.file.buffer
      );

    return res.status(200).json({
      success: true,
      message:
        "Image uploaded successfully.",
      data: {
        imageUrl: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error(
      "Other Expense Image Upload Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to upload image.",
      error: error.message,
    });
  }
};

// =====================================================
// ADD OTHER EXPENSE
// =====================================================

const addOtherExpense = async (
  req,
  res
) => {
  try {
    const {
      productId,
      productName,
      supplierName,
      purchaseDate,
      purchaseCost,
      quantity,
      purchaseImage,
    } = req.body;

    // -------------------------------------------------
    // Supplier validation
    // -------------------------------------------------

    if (
      !supplierName ||
      !supplierName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Supplier name is required.",
      });
    }

    // -------------------------------------------------
    // Date validation
    // -------------------------------------------------

    if (!purchaseDate) {
      return res.status(400).json({
        success: false,
        message:
          "Purchase date is required.",
      });
    }

    // -------------------------------------------------
    // Cost validation
    // -------------------------------------------------

    if (
      purchaseCost === undefined ||
      purchaseCost === "" ||
      Number(purchaseCost) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid purchase cost.",
      });
    }

    // -------------------------------------------------
    // Quantity validation
    // -------------------------------------------------

    if (
      quantity === undefined ||
      quantity === "" ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid quantity.",
      });
    }

    // -------------------------------------------------
    // Create ONLY OtherExpense
    // -------------------------------------------------

    const expense =
      await OtherExpense.create({
        productId:
          productId?.trim() || "",

        productName:
          productName?.trim() || "",

        supplierName:
          supplierName.trim(),

        purchaseDate,

        purchaseCost:
          Number(purchaseCost),

        quantity:
          Number(quantity),

        purchaseImage:
          purchaseImage || "",
      });

    return res.status(201).json({
      success: true,
      message:
        "Other expense saved successfully.",

      data: expense,
    });
  } catch (error) {
    console.error(
      "Add Other Expense Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to save other expense.",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL OTHER EXPENSES
// =====================================================

const getOtherExpenses = async (
  req,
  res
) => {
  try {
    const expenses =
      await OtherExpense.find().sort({
        purchaseDate: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    console.error(
      "Get Other Expenses Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch other expenses.",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE OTHER EXPENSE
// =====================================================

const getOtherExpenseById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const expense =
      await OtherExpense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message:
          "Other expense not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: expense,
    });
  } catch (error) {
    console.error(
      "Get Other Expense Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch other expense.",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE OTHER EXPENSE
// =====================================================

const updateOtherExpense = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const {
      productId,
      productName,
      supplierName,
      purchaseDate,
      purchaseCost,
      quantity,
      purchaseImage,
    } = req.body;

    // -------------------------------------------------
    // Validation
    // -------------------------------------------------

    if (
      !supplierName ||
      !supplierName.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Supplier name is required.",
      });
    }

    if (!purchaseDate) {
      return res.status(400).json({
        success: false,
        message:
          "Purchase date is required.",
      });
    }

    if (
      purchaseCost === undefined ||
      purchaseCost === "" ||
      Number(purchaseCost) < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid purchase cost.",
      });
    }

    if (
      quantity === undefined ||
      quantity === "" ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter a valid quantity.",
      });
    }

    // -------------------------------------------------
    // Find ONLY OtherExpense
    // -------------------------------------------------

    const expense =
      await OtherExpense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message:
          "Other expense not found.",
      });
    }

    // -------------------------------------------------
    // If image changed, delete old image
    // -------------------------------------------------

    if (
      purchaseImage &&
      purchaseImage !==
        expense.purchaseImage
    ) {
      await deleteFromCloudinary(
        expense.purchaseImage
      );
    }

    // -------------------------------------------------
    // Update ONLY OtherExpense
    // -------------------------------------------------

    expense.productId =
      productId?.trim() || "";

    expense.productName =
      productName?.trim() || "";

    expense.supplierName =
      supplierName.trim();

    expense.purchaseDate =
      purchaseDate;

    expense.purchaseCost =
      Number(purchaseCost);

    expense.quantity =
      Number(quantity);

    expense.purchaseImage =
      purchaseImage || "";

    await expense.save();

    return res.status(200).json({
      success: true,
      message:
        "Other expense updated successfully.",

      data: expense,
    });
  } catch (error) {
    console.error(
      "Update Other Expense Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update other expense.",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE OTHER EXPENSE
// =====================================================

const deleteOtherExpense = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const expense =
      await OtherExpense.findById(id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message:
          "Other expense not found.",
      });
    }

    // -------------------------------------------------
    // Delete Cloudinary image
    // -------------------------------------------------

    if (expense.purchaseImage) {
      await deleteFromCloudinary(
        expense.purchaseImage
      );
    }

    // -------------------------------------------------
    // Delete ONLY OtherExpense
    // -------------------------------------------------

    await OtherExpense.findByIdAndDelete(
      id
    );

    return res.status(200).json({
      success: true,
      message:
        "Other expense deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete Other Expense Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete other expense.",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  uploadOtherExpenseImage,
  addOtherExpense,
  getOtherExpenses,
  getOtherExpenseById,
  updateOtherExpense,
  deleteOtherExpense,
};