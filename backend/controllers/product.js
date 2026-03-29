const Product = require("../models/product");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// إضافة منتج جديد
const createProduct = catchAsync(async (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((file) => "uploads/" + file.filename);
  }
  const product = await Product.create(req.body);
  res.status(201).json({ status: "success", data: product });
});

// جلب كل المنتجات (مع filter اختياري بالـ category)
const getProducts = catchAsync(async (req, res, next) => {
  const filter = {};

  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.isActive !== undefined) {
    filter.isActive = req.query.isActive === "true";
  }

  const products = await Product.find(filter).populate("category", "name slug");

  res
    .status(200)
    .json({ status: "success", results: products.length, data: products });
});

// جلب منتج واحد
const getProductById = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate("category", "name slug")
    .populate("relatedProducts", "name price finalPrice images");

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res.status(200).json({ status: "success", data: product });
});

// تعديل منتج
const updateProduct = catchAsync(async (req, res, next) => {
  if (req.files && req.files.length > 0) {
    req.body.images = req.files.map((file) => "uploads/" + file.filename);
  }
  // بنستخدم findById + save عشان الـ pre('save') hook يشتغل ويحسب finalPrice
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  // تحديث الـ fields
  const allowedFields = [
    "name",
    "description",
    "category",
    "price",
    "discountPercent",
    "stock",
    "images",
    "relatedProducts",
    "isActive",
  ];

  // allowedFields.forEach((field) => {
  //   if (req.body[field] !== undefined) {
  //     product[field] = req.body[field];
  //   }
  // });

  allowedFields.forEach((field) => {
    // تأكد إن الحقل موجود في الـ body ومش قيمته null أو undefined
    if (req.body[field] !== undefined && req.body[field] !== null) {
      
      // تعامل خاص مع الصور عشان متعملش overwrite للمصفوفة لو هي مبعوتة كـ files
      if (field === "images" && req.files && req.files.length > 0) {
          // لو فيه ملفات جديدة، احنا ديجا ضفناها في req.body.images فوق
          product.images = req.body.images; 
      } else {
          product[field] = req.body[field];
      }
    }
  });
  
  await product.save(); // هيشغّل الـ pre('save') hook ويحسب finalPrice

  res.status(200).json({ status: "success", data: product });
});

// حذف منتج
const deleteProduct = catchAsync(async (req, res, next) => {
  const product = await Product.findByIdAndDelete(req.params.id);

  if (!product) {
    return next(new AppError("Product not found", 404));
  }

  res
    .status(200)
    .json({ status: "success", message: "Product deleted successfully" });
});

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
