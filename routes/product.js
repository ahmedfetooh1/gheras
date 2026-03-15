const express = require("express");
const router = express.Router();

const productController = require('../controllers/product')

router.get("/", productController.getProducts)
router.post("/add", productController.createProduct)


module.exports = router;