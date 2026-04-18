const Cart = require("../models/cart");
const Product = require("../models/product");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// 1. الحصول على السلة
exports.getCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({
    $or: [{ user: userId }, { userId: userId }],
  }).populate("items.product", "name images stock isActive");

  if (!cart) {
    return res.status(200).json({ status: "success", data: { items: [], totalPrice: 0 } });
  }

  res.status(200).json({ status: "success", data: cart });
});

// 2. إضافة منتج للسلة
exports.addToCart = catchAsync(async (req, res, next) => {
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findById(productId);

  if (!product || !product.isActive) return next(new AppError("Product not found or inactive", 404));
  if (product.stock < quantity) return next(new AppError("Not enough stock", 400));

  const userId = req.user.id;
  let cart = await Cart.findOne({
    $or: [{ user: userId }, { userId: userId }],
  });
  if (!cart) cart = new Cart({ user: userId, userId: userId, items: [] });

  const existingItem = cart.items.find(item => item.product.toString() === productId);

  if (existingItem) {
    if (product.stock < existingItem.quantity + quantity) {
      return next(new AppError("Stock limit reached for this item", 400));
    }
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      product: product._id,
      name: product.name,
      price: product.price,
      discountPercent: product.discountPercent || 0,
      finalPrice: product.finalPrice || product.price,
      quantity
    });
  }

  await cart.save();
  await cart.populate("items.product", "name images stock isActive");
  res.status(200).json({ status: "success", data: cart });
});

// 3. تعديل الكمية (Update Quantity)
exports.updateCartItem = catchAsync(async (req, res, next) => {
  const { productId, quantity } = req.body;

  if (quantity < 1) return next(new AppError("Quantity must be at least 1", 400));

  const userId = req.user.id;
  const cart = await Cart.findOne({ $or: [{ user: userId }, { userId: userId }] });
  if (!cart) return next(new AppError("Cart not found", 404));

  const item = cart.items.find(i => i.product.toString() === productId);
  if (!item) return next(new AppError("Item not found in cart", 404));

  const product = await Product.findById(productId);
  if (product.stock < quantity) return next(new AppError("Not enough stock", 400));

  item.quantity = quantity;
  await cart.save();
  await cart.populate("items.product", "name images stock isActive");

  res.status(200).json({ status: "success", data: cart });
});

// 4. حذف منتج واحد
exports.removeCartItem = catchAsync(async (req, res, next) => {
  const { productId } = req.params;

  const userId = req.user.id;
  const cart = await Cart.findOne({ $or: [{ user: userId }, { userId: userId }] });
  if (!cart) return next(new AppError("Cart not found", 404));

  cart.items = cart.items.filter(item => item.product.toString() !== productId);

  await cart.save();
  await cart.populate("items.product", "name images stock isActive");
  res.status(200).json({ status: "success", data: cart });
});

// 5. مسح السلة بالكامل
exports.clearCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  await Cart.findOneAndDelete({ $or: [{ user: userId }, { userId: userId }] });
  res.status(204).json({ status: "success", data: null });
});