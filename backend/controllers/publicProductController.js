const mongoose = require("mongoose");

const { getProductDB } = require("../config/productDb");
const { getProductModel } = require("../models/Product");

// =====================================================
// GET ALL PUBLIC PRODUCTS
// =====================================================

const getPublicProducts = async (req, res) => {
  try {
    const productDB = getProductDB();
    const Product = getProductModel(productDB);

    console.log("=================================");
    console.log("PRODUCT DB NAME:", productDB.name);
    console.log("PRODUCT DB HOST:", productDB.host);
    console.log("PRODUCT COLLECTION:", Product.collection.name);

    const totalProducts = await Product.countDocuments();

    console.log("TOTAL PRODUCTS:", totalProducts);

    const products = await Product.find()
      .select(
        "_id name sku hsnCode category subcategory image description size sellingPrice stock status"
      )
      .sort({
        createdAt: -1,
      });

    console.log("PRODUCTS FOUND:", products.length);

    res.json({
      success: true,
      count: products.length,
      products,
      debug: {
        database: productDB.name,
        collection: Product.collection.name,
        totalProducts,
      },
    });
  } catch (error) {
    console.error("GET PUBLIC PRODUCTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE PUBLIC PRODUCT
// =====================================================

const getPublicProduct = async (req, res) => {
  try {
    const productDB = getProductDB();
    const Product = getProductModel(productDB);

    const product = await Product.findOne({
      _id: req.params.id,
    }).select(
      "_id name sku hsnCode category subcategory image description size sellingPrice stock status"
    );

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
    console.error("GET PUBLIC PRODUCT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getPublicProducts,
  getPublicProduct,
};