const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");

const { authentication, authorization } = require("../middlewares/authentication");
const productController = require('../controllers/product')

// public routes — أي حد يقدر يشوف المنتجات
router.get("/", productController.getProducts)
router.get("/:id", productController.getProductById)

// admin routes — الإضافة والتعديل والحذف للـ admin بس
router.post("/add", authentication, authorization("admin"),upload.array("images", 5), productController.createProduct)
router.put("/:id", authentication, authorization("admin"),upload.array("images", 5), productController.updateProduct)
router.delete("/:id", authentication, authorization("admin"), productController.deleteProduct)

module.exports = router;