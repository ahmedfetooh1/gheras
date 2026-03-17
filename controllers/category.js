const Category = require('../models/category')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

// إنشاء كاتيجوري
const createCategory = catchAsync(async (req, res, next) => {
  const category = await Category.create(req.body)

  res.status(201).json({
    status: "success",
    message: "Category created successfully",
    data: category
  })
})

// جلب كل الكاتيجوري
const getCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find()

  res.status(200).json({ status: "success", results: categories.length, data: categories })
})

// جلب كاتيجوري واحدة
const getCategoryById = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id)

  if (!category) {
    return next(new AppError("Category not found", 404))
  }

  res.status(200).json({ status: "success", data: category })
})

// تعديل كاتيجوري
const updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )

  if (!category) {
    return next(new AppError("Category not found", 404))
  }

  res.status(200).json({ status: "success", data: category })
})

// حذف كاتيجوري
const deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id)

  if (!category) {
    return next(new AppError("Category not found", 404))
  }

  res.status(200).json({ status: "success", message: "Category deleted successfully" })
})

module.exports = { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory }