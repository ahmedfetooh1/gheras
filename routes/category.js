const express = require('express');
const router = express.Router();

const { authentication, authorization } = require("../middlewares/authentication");
const category = require('../controllers/category')

// public routes
router.get("/", category.getCategories)
router.get("/:id", category.getCategoryById)

// admin routes
router.post("/", authentication, authorization("admin"), category.createCategory)
router.patch("/:id", authentication, authorization("admin"), category.updateCategory)
router.delete("/:id", authentication, authorization("admin"), category.deleteCategory)

module.exports = router