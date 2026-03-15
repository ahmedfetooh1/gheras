const Product = require('../models/product')



// إضافة منتج جديد
let createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body)
    res.json(product)
  } catch (err) {
    res.status(400).json({ msg: err.message })
  }
}

// جلب كل المنتجات
let getProducts = async (req, res) => {
  try {
    const products = await Product.find()
    res.json(products)
  } catch (err) {
    res.status(400).json({ msg: err.message })
  }
}

// جلب منتج واحد
let getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ msg: "Product not found" })
    res.json(product)
  } catch (err) {
    res.status(400).json({ msg: err.message })
  }
}

module.exports = {createProduct,getProducts,getProductById}