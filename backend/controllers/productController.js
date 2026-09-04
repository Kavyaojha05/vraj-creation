const Product = require("../models/Product");
<<<<<<< HEAD
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
=======
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7

// =====================================================
// HELPER - CREATE SIZE
// =====================================================
<<<<<<< HEAD
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

=======

const createSize = (length, breadth, height, sizeUnit, existingSize = "") => {
  const parts = [];

  if (
    length !== undefined &&
    length !== null &&
    length !== "" &&
    !Number.isNaN(Number(length))
  ) {
    parts.push(Number(length));
  }

  if (
    breadth !== undefined &&
    breadth !== null &&
    breadth !== "" &&
    !Number.isNaN(Number(breadth))
  ) {
    parts.push(Number(breadth));
  }

  if (
    height !== undefined &&
    height !== null &&
    height !== "" &&
    !Number.isNaN(Number(height))
  ) {
    parts.push(Number(height));
  }

  // If dimensions are available, create final size
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
  if (parts.length > 0) {
    return `${parts.join(" × ")} ${sizeUnit || "cm"}`;
  }

<<<<<<< HEAD
=======
  // Otherwise use size sent from frontend
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
  if (existingSize && String(existingSize).trim()) {
    return String(existingSize).trim();
  }

  return "";
};

// =====================================================
<<<<<<< HEAD
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
=======
// GET ALL PRODUCTS
// =====================================================

const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    res.json({
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);
<<<<<<< HEAD
    return res.status(500).json({
=======

    res.status(500).json({
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE PRODUCT
// =====================================================
<<<<<<< HEAD
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
=======

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

<<<<<<< HEAD
    return res.status(200).json({
=======
    res.json({
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);
<<<<<<< HEAD
    return res.status(500).json({
=======

    res.status(500).json({
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// =====================================================
<<<<<<< HEAD
// CREATE PRODUCT (FAST DIRECT INSERT)
// =====================================================
=======
// CREATE PRODUCT
// =====================================================

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      subcategory,
<<<<<<< HEAD
=======

      // SIZE
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      length,
      breadth,
      height,
      sizeUnit,
      size,
<<<<<<< HEAD
=======

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      description,
      purchasePrice,
      sellingPrice,
      stock,
      minimumStock,
      supplier,
      status,
    } = req.body;

<<<<<<< HEAD
    if (!name || !sku || !category || purchasePrice === undefined || sellingPrice === undefined) {
=======
    // =================================================
    // REQUIRED FIELDS
    // =================================================

    if (
      !name ||
      !sku ||
      !category ||
      purchasePrice === undefined ||
      sellingPrice === undefined
    ) {
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      return res.status(400).json({
        success: false,
        message: "Required product fields are missing",
      });
    }

<<<<<<< HEAD
=======
    // =================================================
    // CONVERT NUMBERS
    // =================================================

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
    const purchasePriceNumber = Number(purchasePrice);
    const sellingPriceNumber = Number(sellingPrice);
    const stockNumber = Number(stock || 0);
    const minimumStockNumber = Number(minimumStock || 5);

<<<<<<< HEAD
=======
    // =================================================
    // VALIDATE NUMBERS
    // =================================================

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
    if (
      Number.isNaN(purchasePriceNumber) ||
      Number.isNaN(sellingPriceNumber) ||
      Number.isNaN(stockNumber) ||
<<<<<<< HEAD
      Number.isNaN(minimumStockNumber) ||
=======
      Number.isNaN(minimumStockNumber)
    ) {
      return res.status(400).json({
        success: false,
        message: "Price and stock must be valid numbers",
      });
    }

    // =================================================
    // NEGATIVE VALIDATION
    // =================================================

    if (
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      purchasePriceNumber < 0 ||
      sellingPriceNumber < 0 ||
      stockNumber < 0 ||
      minimumStockNumber < 0
    ) {
      return res.status(400).json({
        success: false,
<<<<<<< HEAD
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
=======
        message: "Price and stock cannot be negative",
      });
    }

    // =================================================
    // CLEAN SKU
    // =================================================

    const cleanSku = sku.trim().toUpperCase();

    // =================================================
    // DUPLICATE SKU
    // =================================================

    const existingProduct = await Product.findOne({
      sku: cleanSku,
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }

    // =================================================
    // IMAGE - CLOUDINARY
    // =================================================

    let image = "";

    if (req.file) {
      image = req.file.path;
    }

    // =================================================
    // SIZE
    // =================================================

    const finalSize = createSize(
      length,
      breadth,
      height,
      sizeUnit,
      size
    );

    console.log("PRODUCT SIZE:", finalSize);

    // =================================================
    // CREATE PRODUCT
    // =================================================

    const product = await Product.create({
      name: name.trim(),

      sku: cleanSku,

      category: category.trim(),

      subcategory: subcategory?.trim() || "",

      image,

      description: description?.trim() || "",

      // IMPORTANT
      size: finalSize,

      purchasePrice: purchasePriceNumber,

      sellingPrice: sellingPriceNumber,

      stock: stockNumber,

      minimumStock: minimumStockNumber,

      supplier: supplier?.trim() || "",

      status: status || "active",
    });

    // =================================================
    // RESPONSE
    // =================================================

    res.status(201).json({
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

<<<<<<< HEAD
=======
    // Duplicate key safety
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }

<<<<<<< HEAD
    return res.status(500).json({
=======
    res.status(500).json({
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// =====================================================
<<<<<<< HEAD
// UPDATE PRODUCT (SINGLE ROUND-TRIP ATOMIC UPDATE)
// =====================================================
const updateProduct = async (req, res) => {
  try {
=======
// UPDATE PRODUCT
// =====================================================

const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
    const {
      name,
      sku,
      category,
      subcategory,
<<<<<<< HEAD
=======

      // SIZE
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      length,
      breadth,
      height,
      sizeUnit,
      size,
<<<<<<< HEAD
=======

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      description,
      purchasePrice,
      sellingPrice,
      stock,
      minimumStock,
      supplier,
      status,
    } = req.body;

<<<<<<< HEAD
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
=======
    // =================================================
    // SKU
    // =================================================

    if (sku) {
      const cleanSku = sku.trim().toUpperCase();

      if (cleanSku !== product.sku) {
        const skuExists = await Product.findOne({
          sku: cleanSku,
          _id: {
            $ne: product._id,
          },
        });

        if (skuExists) {
          return res.status(400).json({
            success: false,
            message: "SKU already exists",
          });
        }

        product.sku = cleanSku;
      }
    }

    // =================================================
    // NUMBER VALIDATION
    // =================================================

    if (
      purchasePrice !== undefined &&
      (
        Number.isNaN(Number(purchasePrice)) ||
        Number(purchasePrice) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Purchase price must be a valid positive number",
      });
    }

    if (
      sellingPrice !== undefined &&
      (
        Number.isNaN(Number(sellingPrice)) ||
        Number(sellingPrice) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be a valid positive number",
      });
    }

    if (
      stock !== undefined &&
      (
        Number.isNaN(Number(stock)) ||
        Number(stock) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock must be a valid positive number",
      });
    }

    if (
      minimumStock !== undefined &&
      (
        Number.isNaN(Number(minimumStock)) ||
        Number(minimumStock) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum stock must be a valid positive number",
      });
    }

    // =================================================
    // SIZE NUMBER VALIDATION
    // =================================================

    const sizeFields = [
      {
        name: "Length",
        value: length,
      },
      {
        name: "Breadth",
        value: breadth,
      },
      {
        name: "Height",
        value: height,
      },
    ];

    for (const field of sizeFields) {
      if (
        field.value !== undefined &&
        field.value !== null &&
        field.value !== ""
      ) {
        if (
          Number.isNaN(Number(field.value)) ||
          Number(field.value) < 0
        ) {
          return res.status(400).json({
            success: false,
            message: `${field.name} must be a valid positive number`,
          });
        }
      }
    }

    // =================================================
    // UPDATE BASIC FIELDS
    // =================================================

    product.name =
      name?.trim() ?? product.name;

    product.category =
      category?.trim() ?? product.category;

    product.subcategory =
      subcategory?.trim() ?? product.subcategory;

    product.description =
      description?.trim() ?? product.description;

    // =================================================
    // UPDATE NUMBERS
    // =================================================

    if (purchasePrice !== undefined) {
      product.purchasePrice = Number(purchasePrice);
    }

    if (sellingPrice !== undefined) {
      product.sellingPrice = Number(sellingPrice);
    }

    if (stock !== undefined) {
      product.stock = Number(stock);
    }

    if (minimumStock !== undefined) {
      product.minimumStock = Number(minimumStock);
    }

    // =================================================
    // SUPPLIER
    // =================================================

    product.supplier =
      supplier?.trim() ?? product.supplier;

    // =================================================
    // STATUS
    // =================================================

    product.status =
      status ?? product.status;

    // =================================================
    // SIZE
    // =================================================

    const dimensionsWereSent =
      length !== undefined ||
      breadth !== undefined ||
      height !== undefined ||
      sizeUnit !== undefined;

    if (dimensionsWereSent) {
      const finalSize = createSize(
        length,
        breadth,
        height,
        sizeUnit,
        size
      );

      product.size = finalSize;

      console.log(
        "UPDATED PRODUCT SIZE:",
        finalSize
      );
    } else if (
      size !== undefined
    ) {
      product.size =
        String(size).trim();
    }

    // =================================================
    // NEW IMAGE - CLOUDINARY
    // =================================================

    if (req.file) {
      product.image = req.file.path;
    }

    // =================================================
    // SAVE
    // =================================================

    await product.save();

    // =================================================
    // RESPONSE
    // =================================================

    res.json({
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
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

<<<<<<< HEAD
    return res.status(500).json({
=======
    res.status(500).json({
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE PRODUCT
// =====================================================
<<<<<<< HEAD
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
=======

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

<<<<<<< HEAD
    return res.status(200).json({
=======
    await product.deleteOne();

    res.json({
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);
<<<<<<< HEAD
    return res.status(500).json({
=======

    res.status(500).json({
>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

<<<<<<< HEAD
=======
// =====================================================
// EXPORT
// =====================================================

>>>>>>> fb2cf8dca7ee4ab04f0384f3cb31d6661a8fa4a7
module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};