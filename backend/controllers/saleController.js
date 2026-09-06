const Sale = require("../models/Sale");
const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");

// =====================================================
// HELPERS
// =====================================================

const getProductStock = (product) => {
  if (!product) return 0;

  if (product.quantity !== undefined && product.quantity !== null) {
    return Number(product.quantity) || 0;
  }

  return Number(product.stock) || 0;
};

const setProductStock = (product, stock) => {
  if (product.quantity !== undefined) {
    product.quantity = stock;
  } else {
    product.stock = stock;
  }
};

const getProductImage = (product) => {
  return (
    product?.productImage ||
    product?.image ||
    product?.imageUrl ||
    ""
  );
};

// =====================================================
// FIND PRODUCT BY PRODUCT ID / SKU / MONGODB ID
// =====================================================

const findProductById = async (value) => {
  const searchValue = String(value || "").trim();

  if (!searchValue) return null;

  const queries = [
    { productId: searchValue },
    { sku: searchValue },
  ];

  // MongoDB ObjectId
  if (/^[0-9a-fA-F]{24}$/.test(searchValue)) {
    queries.push({ _id: searchValue });
  }

  return Product.findOne({
    $or: queries,
  });
};

// =====================================================
// CLOUDINARY UPLOAD
// =====================================================

const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error("Image buffer missing"));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "vraj-creation/sales",
        resource_type: "image",
        transformation: [
          {
            width: 1200,
            height: 1200,
            crop: "limit",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve(result);
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

    if (uploadIndex === -1) return;

    const publicIdParts = parts.slice(uploadIndex + 1);

    if (
      publicIdParts[0] &&
      /^v\d+$/.test(publicIdParts[0])
    ) {
      publicIdParts.shift();
    }

    const publicIdWithExtension =
      publicIdParts.join("/");

    const publicId = publicIdWithExtension.replace(
      /\.[^/.]+$/,
      ""
    );

    if (!publicId) return;

    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    // Delete fail hone par sale operation ko fail nahi karna.
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
    const page = Number.parseInt(req.query.page, 10);
    const limit = Number.parseInt(req.query.limit, 10);

    const selectFields =
      "productId productName productImage platform date quantity bankSettlementAmount packagingCost colouringCost createdAt";

    // =====================================================
    // PAGINATION
    // =====================================================

    if (
      Number.isInteger(page) &&
      page > 0 &&
      Number.isInteger(limit) &&
      limit > 0
    ) {
      const skip = (page - 1) * limit;

      const [sales, total] = await Promise.all([
        Sale.find({})
          .select(selectFields)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        Sale.estimatedDocumentCount(),
      ]);

      return res.status(200).json({
        success: true,
        count: total,
        page,
        pages: Math.ceil(total / limit),
        sales,
      });
    }

    // =====================================================
    // NORMAL REQUEST
    // =====================================================

    const sales = await Sale.find({})
      .select(selectFields)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    return res.status(200).json(sales);
  } catch (error) {
    console.error("GET SALES ERROR:", error);

    return res.status(500).json({
      success: false,
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
    const sale = await Sale.findById(req.params.id).lean();

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    return res.status(200).json(sale);
  } catch (error) {
    console.error("GET SALE BY ID ERROR:", error);

    return res.status(500).json({
      success: false,
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

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !productId ||
      !platform ||
      !date ||
      quantity === undefined ||
      quantity === "" ||
      bankSettlementAmount === undefined ||
      bankSettlementAmount === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const saleQuantity = Number(quantity);
    const settlement = Number(bankSettlementAmount);
    const packaging = Number(packagingCost || 0);
    const colouring = Number(colouringCost || 0);

    if (
      !Number.isFinite(saleQuantity) ||
      saleQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    if (
      !Number.isFinite(settlement) ||
      settlement < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Bank settlement amount is invalid",
      });
    }

    if (
      !Number.isFinite(packaging) ||
      packaging < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Packaging cost is invalid",
      });
    }

    if (
      !Number.isFinite(colouring) ||
      colouring < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Colouring cost is invalid",
      });
    }

    // =====================================================
    // FIND PRODUCT
    // =====================================================

    const product = await findProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found. Please enter a valid Product ID or SKU.",
      });
    }

    const currentStock = getProductStock(product);

    if (currentStock < saleQuantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available stock: ${currentStock}`,
      });
    }

    // =====================================================
    // IMAGE
    // =====================================================

    let productImage = getProductImage(product);

    if (req.file?.buffer) {
      const result = await uploadToCloudinary(
        req.file.buffer
      );

      productImage = result.secure_url;
    }

    // =====================================================
    // CREATE SALE + UPDATE STOCK
    // =====================================================

    const sale = new Sale({
      productId: String(productId).trim(),

      productName:
        product.name ||
        product.productName ||
        String(productName || "").trim(),

      productImage,

      platform: String(platform)
        .trim()
        .toLowerCase(),

      date,

      quantity: saleQuantity,

      bankSettlementAmount: settlement,

      packagingCost: packaging,

      colouringCost: colouring,
    });

    setProductStock(
      product,
      currentStock - saleQuantity
    );

    // Parallel save
    await Promise.all([
      sale.save(),
      product.save(),
    ]);

    return res.status(201).json({
      success: true,
      message: "Sale created successfully",
      sale,
    });
  } catch (error) {
    console.error("CREATE SALE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create sale",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE SALE
// =====================================================

const updateSale = async (req, res) => {
  try {
    const existingSale = await Sale.findById(
      req.params.id
    );

    if (!existingSale) {
      return res.status(404).json({
        success: false,
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

    // =====================================================
    // VALIDATION
    // =====================================================

    if (
      !productId ||
      !platform ||
      !date ||
      quantity === undefined ||
      quantity === "" ||
      bankSettlementAmount === undefined ||
      bankSettlementAmount === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    const newQuantity = Number(quantity);
    const settlement = Number(bankSettlementAmount);
    const packaging = Number(packagingCost || 0);
    const colouring = Number(colouringCost || 0);

    if (
      !Number.isFinite(newQuantity) ||
      newQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    if (
      !Number.isFinite(settlement) ||
      settlement < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Bank settlement amount is invalid",
      });
    }

    if (
      !Number.isFinite(packaging) ||
      packaging < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Packaging cost is invalid",
      });
    }

    if (
      !Number.isFinite(colouring) ||
      colouring < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Colouring cost is invalid",
      });
    }

    // =====================================================
    // FIND PRODUCTS IN PARALLEL
    // =====================================================

    const [oldProduct, newProduct] =
      await Promise.all([
        findProductById(existingSale.productId),
        findProductById(productId),
      ]);

    if (!newProduct) {
      return res.status(404).json({
        success: false,
        message:
          "Product not found. Please enter a valid Product ID or SKU.",
      });
    }

    // =====================================================
    // STOCK
    // =====================================================

    const oldQuantity = Number(
      existingSale.quantity || 0
    );

    const isSameProduct =
      oldProduct &&
      String(oldProduct._id) ===
        String(newProduct._id);

    let availableStock =
      getProductStock(newProduct);

    // Same product:
    // previous sale quantity becomes available again.
    if (isSameProduct) {
      availableStock += oldQuantity;
    }

    if (availableStock < newQuantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Available stock: ${availableStock}`,
      });
    }

    // =====================================================
    // IMAGE
    // =====================================================

    let productImage =
      existingSale.productImage ||
      getProductImage(newProduct);

    let oldImageToDelete = null;

    if (req.file?.buffer) {
      // Upload first
      const result = await uploadToCloudinary(
        req.file.buffer
      );

      productImage = result.secure_url;

      // Delete old image AFTER successful upload.
      oldImageToDelete =
        existingSale.productImage || null;
    }

    // =====================================================
    // STOCK UPDATE
    // =====================================================

    const productOperations = [];

    if (
      oldProduct &&
      !isSameProduct
    ) {
      const oldStock =
        getProductStock(oldProduct);

      setProductStock(
        oldProduct,
        oldStock + oldQuantity
      );

      productOperations.push(
        oldProduct.save()
      );
    }

    setProductStock(
      newProduct,
      availableStock - newQuantity
    );

    productOperations.push(
      newProduct.save()
    );

    // =====================================================
    // UPDATE SALE
    // =====================================================

    existingSale.productId =
      String(productId).trim();

    existingSale.productName =
      newProduct.name ||
      newProduct.productName ||
      String(productName || "").trim();

    existingSale.productImage =
      productImage;

    existingSale.platform =
      String(platform)
        .trim()
        .toLowerCase();

    existingSale.date = date;

    existingSale.quantity =
      newQuantity;

    existingSale.bankSettlementAmount =
      settlement;

    existingSale.packagingCost =
      packaging;

    existingSale.colouringCost =
      colouring;

    // Sale + products save together
    await Promise.all([
      existingSale.save(),
      ...productOperations,
    ]);

    // =====================================================
    // CLOUDINARY DELETE
    // IMPORTANT:
    // Do NOT make user wait for image deletion.
    // =====================================================

    if (oldImageToDelete) {
      deleteFromCloudinary(
        oldImageToDelete
      ).catch((error) => {
        console.error(
          "BACKGROUND CLOUDINARY DELETE ERROR:",
          error.message
        );
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sale updated successfully",
      sale: existingSale,
    });
  } catch (error) {
    console.error("UPDATE SALE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update sale",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE SALE
// =====================================================

const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(
      req.params.id
    );

    if (!sale) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      });
    }

    // =====================================================
    // RESTORE STOCK
    // =====================================================

    const product = await findProductById(
      sale.productId
    );

    if (product) {
      const currentStock =
        getProductStock(product);

      setProductStock(
        product,
        currentStock +
          Number(sale.quantity || 0)
      );

      await product.save();
    }

    // =====================================================
    // DELETE SALE FIRST
    // =====================================================

    await Sale.findByIdAndDelete(
      req.params.id
    );

    // =====================================================
    // CLOUDINARY DELETE IN BACKGROUND
    // =====================================================

    if (sale.productImage) {
      deleteFromCloudinary(
        sale.productImage
      ).catch((error) => {
        console.error(
          "BACKGROUND CLOUDINARY DELETE ERROR:",
          error.message
        );
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sale deleted successfully",
    });
  } catch (error) {
    console.error("DELETE SALE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete sale",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getSales,
  getSaleById,
  createSale,
  updateSale,
  deleteSale,
};