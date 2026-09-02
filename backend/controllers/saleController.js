const Sale = require("../models/Sale");
const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

// =====================================================
// CLOUDINARY UPLOAD
// =====================================================
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "vraj-creation/sales",
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

    stream.end(fileBuffer);
  });
};

// =====================================================
// DELETE CLOUDINARY IMAGE
// =====================================================
const deleteFromCloudinary = async (imageUrl) => {
  try {
    if (
      !imageUrl ||
      !imageUrl.includes("cloudinary.com")
    ) {
      return;
    }

    const parts = imageUrl.split("/");

    const uploadIndex = parts.findIndex(
      (part) => part === "upload"
    );

    if (uploadIndex === -1) {
      return;
    }

    let publicIdParts = parts.slice(
      uploadIndex + 1
    );

    // Remove Cloudinary version
    if (
      publicIdParts[0] &&
      /^v\d+$/.test(publicIdParts[0])
    ) {
      publicIdParts.shift();
    }

    const publicIdWithExtension =
      publicIdParts.join("/");

    const publicId =
      publicIdWithExtension.replace(
        /\.[^/.]+$/,
        ""
      );

    if (!publicId) {
      return;
    }

    await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: "image",
      }
    );
  } catch (error) {
    console.error(
      "CLOUDINARY DELETE ERROR:",
      error.message
    );
  }
};

// =====================================================
// GET ALL SALES
// =====================================================
const getSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .sort({ createdAt: -1 });

    res.status(200).json(sales);
  } catch (error) {
    console.error(
      "GET SALES ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch sales",
      error: error.message,
    });
  }
};

// =====================================================
// GET SALE BY ID
// =====================================================
const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(
      req.params.id
    );

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    res.status(200).json(sale);
  } catch (error) {
    console.error(
      "GET SALE BY ID ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch sale",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE SALE
// =====================================================
const createSale = async (req, res) => {
  try {
    console.log(
      "SALE BODY:",
      req.body
    );

    console.log(
      "SALE FILE:",
      req.file
        ? req.file.originalname
        : "No image"
    );

    const {
      productId,
      productName,
      platform,
      date,
      quantity,
      bankSettlementAmount,
      packagingCost,
      colouringCost,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================
    if (
      !productId ||
      !productName ||
      !platform ||
      !date ||
      quantity === undefined ||
      quantity === "" ||
      bankSettlementAmount === undefined ||
      bankSettlementAmount === ""
    ) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const saleQuantity =
      Number(quantity);

    const settlement =
      Number(bankSettlementAmount);

    const packaging =
      Number(packagingCost || 0);

    const colouring =
      Number(colouringCost || 0);

    // =================================================
    // NUMBER VALIDATION
    // =================================================
    if (
      !Number.isFinite(saleQuantity) ||
      saleQuantity <= 0
    ) {
      return res.status(400).json({
        message:
          "Quantity must be greater than 0",
      });
    }

    if (
      !Number.isFinite(settlement) ||
      settlement < 0
    ) {
      return res.status(400).json({
        message:
          "Bank settlement amount is invalid",
      });
    }

    if (
      !Number.isFinite(packaging) ||
      packaging < 0
    ) {
      return res.status(400).json({
        message:
          "Packaging cost is invalid",
      });
    }

    if (
      !Number.isFinite(colouring) ||
      colouring < 0
    ) {
      return res.status(400).json({
        message:
          "Colouring cost is invalid",
      });
    }

    // =================================================
    // FIND PRODUCT
    // =================================================
    const product =
      await Product.findOne({
        productId:
          String(productId).trim(),
      });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // =================================================
    // CHECK STOCK
    // =================================================
    const currentStock =
      Number(product.quantity || 0);

    if (
      currentStock < saleQuantity
    ) {
      return res.status(400).json({
        message:
          `Insufficient stock. Available stock: ${currentStock}`,
      });
    }

    // =================================================
    // PRODUCT IMAGE
    // =================================================
    let productImage =
      product.productImage ||
      product.image ||
      "";

    // If user selected a new image
    if (req.file) {
      const result =
        await uploadToCloudinary(
          req.file.buffer
        );

      productImage =
        result.secure_url;

      console.log(
        "SALE CLOUDINARY IMAGE:",
        productImage
      );
    }

    // =================================================
    // CREATE SALE
    // =================================================
    const sale = await Sale.create({
      productId:
        String(productId).trim(),

      productName:
        String(productName).trim(),

      productImage,

      platform:
        String(platform)
          .trim()
          .toLowerCase(),

      date,

      quantity:
        saleQuantity,

      bankSettlementAmount:
        settlement,

      packagingCost:
        packaging,

      colouringCost:
        colouring,
    });

    // =================================================
    // REDUCE PRODUCT STOCK
    // =================================================
    product.quantity =
      currentStock -
      saleQuantity;

    await product.save();

    console.log(
      "PRODUCT STOCK AFTER SALE:",
      product.quantity
    );

    // =================================================
    // RESPONSE
    // =================================================
    res.status(201).json({
      message:
        "Sale created successfully",
      sale,
    });

  } catch (error) {
    console.error(
      "CREATE SALE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create sale",
      error:
        error.message,
    });
  }
};

// =====================================================
// UPDATE SALE
// =====================================================
const updateSale = async (req, res) => {
  try {
    console.log(
      "UPDATE SALE BODY:",
      req.body
    );

    console.log(
      "UPDATE SALE FILE:",
      req.file
        ? req.file.originalname
        : "No image"
    );

    // =================================================
    // FIND EXISTING SALE
    // =================================================
    const existingSale =
      await Sale.findById(
        req.params.id
      );

    if (!existingSale) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    const {
      productId,
      productName,
      platform,
      date,
      quantity,
      bankSettlementAmount,
      packagingCost,
      colouringCost,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================
    if (
      !productId ||
      !productName ||
      !platform ||
      !date ||
      quantity === undefined ||
      quantity === "" ||
      bankSettlementAmount === undefined ||
      bankSettlementAmount === ""
    ) {
      return res.status(400).json({
        message: "Required fields missing",
      });
    }

    const newQuantity =
      Number(quantity);

    const settlement =
      Number(bankSettlementAmount);

    const packaging =
      Number(packagingCost || 0);

    const colouring =
      Number(colouringCost || 0);

    if (
      !Number.isFinite(newQuantity) ||
      newQuantity <= 0
    ) {
      return res.status(400).json({
        message:
          "Quantity must be greater than 0",
      });
    }

    if (
      !Number.isFinite(settlement) ||
      settlement < 0
    ) {
      return res.status(400).json({
        message:
          "Bank settlement amount is invalid",
      });
    }

    if (
      !Number.isFinite(packaging) ||
      packaging < 0
    ) {
      return res.status(400).json({
        message:
          "Packaging cost is invalid",
      });
    }

    if (
      !Number.isFinite(colouring) ||
      colouring < 0
    ) {
      return res.status(400).json({
        message:
          "Colouring cost is invalid",
      });
    }

    // =================================================
    // OLD PRODUCT
    // =================================================
    const oldProduct =
      await Product.findOne({
        productId:
          String(
            existingSale.productId
          ).trim(),
      });

    // =================================================
    // NEW PRODUCT
    // =================================================
    const newProduct =
      await Product.findOne({
        productId:
          String(productId).trim(),
      });

    if (!newProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // =================================================
    // RESTORE OLD SALE QUANTITY
    // =================================================
    if (oldProduct) {
      oldProduct.quantity =
        Number(
          oldProduct.quantity || 0
        ) +
        Number(
          existingSale.quantity || 0
        );

      await oldProduct.save();
    }

    // =================================================
    // CHECK NEW STOCK
    // =================================================
    const availableStock =
      Number(
        newProduct.quantity || 0
      );

    if (
      availableStock <
      newQuantity
    ) {
      // Roll back old stock
      if (oldProduct) {
        oldProduct.quantity =
          Number(
            oldProduct.quantity || 0
          ) -
          Number(
            existingSale.quantity || 0
          );

        await oldProduct.save();
      }

      return res.status(400).json({
        message:
          `Insufficient stock. Available stock: ${availableStock}`,
      });
    }

    // =================================================
    // IMAGE
    // =================================================
    let productImage =
      existingSale.productImage ||
      "";

    // New image selected
    if (req.file) {

      // Delete old Cloudinary image
      if (
        existingSale.productImage
      ) {
        await deleteFromCloudinary(
          existingSale.productImage
        );
      }

      // Upload new image
      const result =
        await uploadToCloudinary(
          req.file.buffer
        );

      productImage =
        result.secure_url;

      console.log(
        "UPDATED CLOUDINARY IMAGE:",
        productImage
      );

    } else if (
      newProduct.productImage
    ) {

      // If no new image selected,
      // use product image if available
      productImage =
        newProduct.productImage;
    }

    // =================================================
    // REDUCE NEW PRODUCT STOCK
    // =================================================
    newProduct.quantity =
      availableStock -
      newQuantity;

    await newProduct.save();

    // =================================================
    // UPDATE SALE
    // =================================================
    existingSale.productId =
      String(productId).trim();

    existingSale.productName =
      String(productName).trim();

    existingSale.productImage =
      productImage;

    existingSale.platform =
      String(platform)
        .trim()
        .toLowerCase();

    existingSale.date =
      date;

    existingSale.quantity =
      newQuantity;

    existingSale.bankSettlementAmount =
      settlement;

    existingSale.packagingCost =
      packaging;

    existingSale.colouringCost =
      colouring;

    const updatedSale =
      await existingSale.save();

    // =================================================
    // RESPONSE
    // =================================================
    res.status(200).json({
      message:
        "Sale updated successfully",
      sale:
        updatedSale,
    });

  } catch (error) {
    console.error(
      "UPDATE SALE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update sale",
      error:
        error.message,
    });
  }
};

// =====================================================
// DELETE SALE
// =====================================================
const deleteSale = async (req, res) => {
  try {
    const sale =
      await Sale.findById(
        req.params.id
      );

    if (!sale) {
      return res.status(404).json({
        message:
          "Sale not found",
      });
    }

    // =================================================
    // RESTORE PRODUCT STOCK
    // =================================================
    const product =
      await Product.findOne({
        productId:
          String(
            sale.productId
          ).trim(),
      });

    if (product) {
      product.quantity =
        Number(
          product.quantity || 0
        ) +
        Number(
          sale.quantity || 0
        );

      await product.save();

      console.log(
        "PRODUCT STOCK RESTORED:",
        product.quantity
      );
    }

    // =================================================
    // DELETE CLOUDINARY IMAGE
    // =================================================
    if (sale.productImage) {
      await deleteFromCloudinary(
        sale.productImage
      );
    }

    // =================================================
    // DELETE SALE
    // =================================================
    await Sale.findByIdAndDelete(
      req.params.id
    );

    // =================================================
    // RESPONSE
    // =================================================
    res.status(200).json({
      message:
        "Sale deleted successfully",
    });

  } catch (error) {
    console.error(
      "DELETE SALE ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to delete sale",
      error:
        error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================
module.exports = {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
};