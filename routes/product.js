const express = require("express");
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/product");
const { authentication } = require("../Middlewares/authentication");

// get all products
router.get("/", getProducts);

// get single product
router.get("/:id", getProductById);

// create product
router.post("/", authentication, createProduct);

// update product
router.put("/:id", authentication, updateProduct);

// delete product
router.delete("/:id", authentication, deleteProduct);

module.exports = router;
