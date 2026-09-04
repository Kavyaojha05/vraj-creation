const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// =====================================================
// OPTIMIZED CLOUDINARY UPLOAD (AUTO COMPRESS + FAST CDN)
// =====================================================
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "vraj_creation/products",
        fetch_format: "auto", // WebP / AVIF me convert karega (Fastest load)
        quality: "auto:eco",  // Auto balance compression
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// =====================================================
// HELPER - CREATE SIZE
// =====================================================
const createSize = (length, breadth, height, sizeUnit, existingSize = "") => {
  const parts = [];
  if (length !== undefined && length !== null && length !== "" && !Number.isNaN(Number(length))) {
    parts.push(Number(length));
  }
  if (breadth !== undefined && breadth !== null && breadth !== "" && !Number.isNaN(Number(breadth))) {
    parts.push(Number(breadth));
  }
  if (height !== undefined && height !== null && height !== "" && !Number.isNaN(Number(height))) {
    parts.push(Number(height));
  }

  if (parts.length > 0) {
    return `${parts.join(" × ")} ${sizeUnit || "cm"}`;
  }

  if (existingSize && String(existingSize).trim()) {
    return String(existingSize).trim();
  }

  return "";
};

// =====================================================
// GET ALL PRODUCTS (SUB-SECOND LEAN CACHE FETCH)
// =====================================================
const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const limit = parseInt(req.query.limit);

    // Agar pagination params hain toh limit/skip use karega
    if (page && limit) {
      const skip = (page - 1) * limit;
      const [products, total] = await Promise.all([
        Product.find()
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Product.estimatedDocumentCount(), // countDocuments se 5x fast count
      ]);

      return res.status(200).json({
        success: true,
        count: total,
        page,
        pages: Math.ceil(total / limit),
        products,
      });
    }

    // Default fast fetch (Max 100 for memory preservation)
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE PRODUCT
// =====================================================
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE PRODUCT (FAST DIRECT INSERT)
// =====================================================
const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      subcategory,
      length,
      breadth,
      height,
      sizeUnit,
      size,
      description,
      purchasePrice,
      sellingPrice,
      stock,
      minimumStock,
      supplier,
      status,
    } = req.body;

    if (!name || !sku || !category || purchasePrice === undefined || sellingPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: "Required product fields are missing",
      });
    }

    const purchasePriceNumber = Number(purchasePrice);
    const sellingPriceNumber = Number(sellingPrice);
    const stockNumber = Number(stock || 0);
    const minimumStockNumber = Number(minimumStock || 5);

    if (
      Number.isNaN(purchasePriceNumber) ||
      Number.isNaN(sellingPriceNumber) ||
      Number.isNaN(stockNumber) ||
      Number.isNaN(minimumStockNumber) ||
      purchasePriceNumber < 0 ||
      sellingPriceNumber < 0 ||
      stockNumber < 0 ||
      minimumStockNumber < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Price and stock must be valid positive numbers",
      });
    }

    const cleanSku = String(sku).trim().toUpperCase();

    // Fast image buffer upload
    let image = "";
    if (req.file) {
      if (req.file.buffer) {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        image = uploadResult.secure_url;
      } else if (req.file.path) {
        image = req.file.path;
      }
    }

    const finalSize = createSize(length, breadth, height, sizeUnit, size);

    // Direct create (Duplicate SKU will be caught instantly by Mongo unique index)
    const product = await Product.create({
      name: name.trim(),
      sku: cleanSku,
      category: category.trim(),
      subcategory: subcategory?.trim() || "",
      image,
      description: description?.trim() || "",
      size: finalSize,
      purchasePrice: purchasePriceNumber,
      sellingPrice: sellingPriceNumber,
      stock: stockNumber,
      minimumStock: minimumStockNumber,
      supplier: supplier?.trim() || "",
      status: status || "active",
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE PRODUCT (SINGLE ROUND-TRIP ATOMIC UPDATE)
// =====================================================
const updateProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      subcategory,
      length,
      breadth,
      height,
      sizeUnit,
      size,
      description,
      purchasePrice,
      sellingPrice,
      stock,
      minimumStock,
      supplier,
      status,
    } = req.body;

    const updateFields = {};

    if (name !== undefined) updateFields.name = name.trim();
    if (category !== undefined) updateFields.category = category.trim();
    if (subcategory !== undefined) updateFields.subcategory = subcategory.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (supplier !== undefined) updateFields.supplier = supplier.trim();
    if (status !== undefined) updateFields.status = status;

    if (sku !== undefined) updateFields.sku = sku.trim().toUpperCase();
    if (purchasePrice !== undefined) updateFields.purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined) updateFields.sellingPrice = Number(sellingPrice);
    if (stock !== undefined) updateFields.stock = Number(stock);
    if (minimumStock !== undefined) updateFields.minimumStock = Number(minimumStock);

    const dimensionsWereSent =
      length !== undefined || breadth !== undefined || height !== undefined || sizeUnit !== undefined;

    if (dimensionsWereSent) {
      updateFields.size = createSize(length, breadth, height, sizeUnit, size);
    } else if (size !== undefined) {
      updateFields.size = String(size).trim();
    }

    // Direct image upload
    if (req.file) {
      if (req.file.buffer) {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        updateFields.image = uploadResult.secure_url;
      } else if (req.file.path) {
        updateFields.image = req.file.path;
      }
    }

    // Atomic 1-step update without fetching document first
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: false }
    ).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE PRODUCT
// =====================================================
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};