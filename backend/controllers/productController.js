const Product = require("../models/Product");

// =====================================================
// HELPER - CREATE SIZE
// =====================================================

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
  if (parts.length > 0) {
    return `${parts.join(" × ")} ${sizeUnit || "cm"}`;
  }

  // Otherwise use size sent from frontend
  if (existingSize && String(existingSize).trim()) {
    return String(existingSize).trim();
  }

  return "";
};

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

      // SIZE
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
      return res.status(400).json({
        success: false,
        message: "Required product fields are missing",
      });
    }

    // =================================================
    // CONVERT NUMBERS
    // =================================================

    const purchasePriceNumber = Number(purchasePrice);
    const sellingPriceNumber = Number(sellingPrice);
    const stockNumber = Number(stock || 0);
    const minimumStockNumber = Number(minimumStock || 5);

    // =================================================
    // VALIDATE NUMBERS
    // =================================================

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

    // =================================================
    // NEGATIVE VALIDATION
    // =================================================

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

      // SIZE
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