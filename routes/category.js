const express = require('express');
const router = express.Router();
const category = require('../controllers/category')


router.post("/", category.createCategory)
router.get("/", category.getCategories)
router.patch("/:id", category.getCategoryById)
router.get("/", category.getCategoryById)


module.exports = router