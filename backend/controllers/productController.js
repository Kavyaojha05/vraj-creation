
  const Product = require("../models/Product");
// =====================================================
// GET ALL PRODUCTS
// =====================================================

const getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    res.status(500).json({
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
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("GET PRODUCT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE PRODUCT
// =====================================================

const createProduct = async (req, res) => {
  try {
    const {
      name,
      sku,
      category,
      subcategory,
      description,
      purchasePrice,
      sellingPrice,
      stock,
      minimumStock,
      supplier,
      status,
    } = req.body;

    // Required fields
    if (
      !name ||
      !sku ||
      !category ||
      purchasePrice === undefined ||
      sellingPrice === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Required product fields are missing",
      });
    }

    // Convert numbers
    const purchasePriceNumber = Number(purchasePrice);
    const sellingPriceNumber = Number(sellingPrice);
    const stockNumber = Number(stock || 0);
    const minimumStockNumber = Number(minimumStock || 5);

    // Validate numbers
    if (
      Number.isNaN(purchasePriceNumber) ||
      Number.isNaN(sellingPriceNumber) ||
      Number.isNaN(stockNumber) ||
      Number.isNaN(minimumStockNumber)
    ) {
      return res.status(400).json({
        success: false,
        message: "Price and stock must be valid numbers",
      });
    }

    // Negative validation
    if (
      purchasePriceNumber < 0 ||
      sellingPriceNumber < 0 ||
      stockNumber < 0 ||
      minimumStockNumber < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Price and stock cannot be negative",
      });
    }

    // Clean SKU
    const cleanSku = sku.trim().toUpperCase();

    // Check duplicate SKU
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
    // CREATE
    // =================================================

    const product = await Product.create({
      name: name.trim(),

      sku: cleanSku,

      category: category.trim(),

      subcategory: subcategory?.trim() || "",

      image,

      description: description?.trim() || "",

      purchasePrice: purchasePriceNumber,

      sellingPrice: sellingPriceNumber,

      stock: stockNumber,

      minimumStock: minimumStockNumber,

      supplier: supplier?.trim() || "",

      status: status || "active",
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    // Duplicate key safety
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "SKU already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// =====================================================
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

    const {
      name,
      sku,
      category,
      subcategory,
      description,
      purchasePrice,
      sellingPrice,
      stock,
      minimumStock,
      supplier,
      status,
    } = req.body;

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
    // NUMBERS
    // =================================================

    if (
      purchasePrice !== undefined &&
      Number(purchasePrice) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Purchase price cannot be negative",
      });
    }

    if (
      sellingPrice !== undefined &&
      Number(sellingPrice) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Selling price cannot be negative",
      });
    }

    if (
      stock !== undefined &&
      Number(stock) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Stock cannot be negative",
      });
    }

    if (
      minimumStock !== undefined &&
      Number(minimumStock) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Minimum stock cannot be negative",
      });
    }

    // =================================================
    // UPDATE FIELDS
    // =================================================

    product.name =
      name?.trim() ?? product.name;

    product.category =
      category?.trim() ?? product.category;

    product.subcategory =
      subcategory?.trim() ?? product.subcategory;

    product.description =
      description?.trim() ?? product.description;

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

    product.supplier =
      supplier?.trim() ?? product.supplier;

    product.status =
      status ?? product.status;

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

    res.json({
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

    res.status(500).json({
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
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("DELETE PRODUCT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
