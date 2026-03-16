const Product = require("../models/product");

const ALLOWED_PRODUCT_FIELDS = [
  "title",
  "description",
  "price",
  "discount",
  "stock",
  "category",
  "images",
  "isActive",
];

// create product
const createProduct = async (req, res) => {
  try {
    const body = {};
    ALLOWED_PRODUCT_FIELDS.forEach((key) => {
      if (req.body[key] !== undefined) body[key] = req.body[key];
    });
    const product = await Product.create(body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// get all products
const getProducts = async (_req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// get product by id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// update product
const updateProduct = async (req, res) => {
  try {
    const body = {};
    ALLOWED_PRODUCT_FIELDS.forEach((key) => {
      if (req.body[key] !== undefined) body[key] = req.body[key];
    });
    const product = await Product.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json(product);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// delete product
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
