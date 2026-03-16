const express = require("express");
const router = express.Router();
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/product");
const { authentication } = require("../middlewares/authentication");

// عرض كل المنتجات
router.get("/", getProducts);

// عرض منتج واحد
router.get("/:id", getProductById);

// إضافة منتج جديد
router.post("/", authentication, createProduct);

// تعديل منتج
router.put("/:id", authentication, updateProduct);

// حذف منتج
router.delete("/:id", authentication, deleteProduct);

module.exports = router;


