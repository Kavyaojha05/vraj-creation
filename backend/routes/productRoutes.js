const express = require("express");

const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/", protect, getProducts);

router.get("/:id", protect, getProduct);

router.post(
  "/",
  protect,
  upload.single("image"),
  createProduct
);

router.put(
  "/:id",
  protect,
  upload.single("image"),
  updateProduct
);

router.delete(
  "/:id",
  protect,
  deleteProduct
);

module.exports = router;