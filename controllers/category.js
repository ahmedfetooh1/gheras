const categorySchema = require('../models/category')

// إنشاء كاتيجوري
let createCategory = async (req, res) => {
  try {

    const category = await categorySchema.create(req.body)

    res.status(201).json({
      message: "Category created successfully",
      category
    })

  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

// جلب كل الكاتيجوري
let getCategories = async (req, res) => {
  try {

    const categories = await categorySchema.find()

    res.json(categories)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// جلب كاتيجوري واحدة
let getCategoryById = async (req, res) => {
  try {

    const category = await categorySchema.findById(req.params.id)

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    res.json(category)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// تعديل كاتيجوري
let updateCategory = async (req, res) => {
  try {

    const category = await categorySchema.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    res.json(category)

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// حذف كاتيجوري
let deleteCategory = async (req, res) => {
  try {

    const category = await categorySchema.findByIdAndDelete(req.params.id)

    if (!category) {
      return res.status(404).json({ message: "Category not found" })
    }

    res.json({ message: "Category deleted successfully" })

  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = {createCategory,getCategories,getCategoryById,updateCategory,deleteCategory}