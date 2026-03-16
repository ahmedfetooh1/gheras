const Cart = require("../models/cart");
const Product = require("../models/product");

const addToCart = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const { productId, quantity = 1 } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    if (quantity <= 0) {
      return res
        .status(400)
        .json({ message: "Quantity must be greater than 0" });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }
    if (quantity > product.stock) {
      return res.status(400).json({ message: `  ${product.stock} stock available` });
    }

    let userCart = await Cart.findOne({ user: userId });

    if (!userCart) {
      userCart = await Cart.create({
        user: userId,
        items: [
          {
            productId,
            title: product.title,
            price: product.finalPrice ?? product.price,
            discount: product.discount,
            qty: quantity,
          },
        ],
        totalQty: quantity,
        subtotal: product.price * quantity,
        discountTotal: (product.discount || 0) * quantity,
        totalCost:
          product.price * quantity - (product.discount || 0) * quantity,
      });
    } else {
      const existingItem = userCart.items.find(
        (item) => item.productId.toString() === productId
      );

      if (existingItem) {
        const newQty = existingItem.qty + quantity;
        if (newQty > product.stock) {
          return res.status(400).json({
            message: `الكمية المتاحة ${product.stock} فقط، وعندك ${existingItem.qty} في السلة`,
          });
        }
        existingItem.qty = newQty;
      } else {
        userCart.items.push({
          productId,
          title: product.title,
          price: product.finalPrice ?? product.price,
          discount: product.discount,
          qty: quantity,
        });
      }

      // calc total count, subtotal, discount and total cost
      userCart.totalQty = userCart.items.reduce((sum, item) => sum + item.qty,0);

      userCart.subtotal = userCart.items.reduce((sum, item) => sum + item.price * item.qty,0);

      userCart.discountTotal = userCart.items.reduce((sum, item) => sum + (item.discount || 0) * item.qty,0);

      userCart.totalCost = userCart.subtotal - userCart.discountTotal;

      await userCart.save();
    }

    await userCart.populate("items.productId");

    res.status(200).json({
      message: "Product added to cart successfully",
      cart: userCart,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeItem = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!productId) {
      return res.status(400).json({ message: "productId is required" });
    }

    const userCart = await Cart.findOne({ user: userId });

    if (!userCart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const initialLength = userCart.items.length;
    userCart.items = userCart.items.filter(
      (item) => item.productId.toString() !== productId
    );

    if (userCart.items.length === initialLength) {
      return res
        .status(404)
        .json({ message: "Product not found in cart" });
    }

    // إعادة حساب المجاميع بعد الحذف
    userCart.totalQty = userCart.items.reduce((sum, item) => sum + item.qty,0);
    userCart.subtotal = userCart.items.reduce((sum, item) => sum + item.price * item.qty,0);
    userCart.discountTotal = userCart.items.reduce((sum, item) => sum + (item.discount || 0) * item.qty,0);
    userCart.totalCost = userCart.subtotal - userCart.discountTotal;

    await userCart.save();
    await userCart.populate("items.productId");

    return res.status(200).json({
      message: "Product removed from cart successfully",
      cart: userCart,
    });
  } catch (err) {
    res.status(500).json({
      message: "Remove from cart failed",
      error: err.message,
    });
  }
};

const getCartItems = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const userCart = await Cart.findOne({ user: userId }).populate(
      "items.productId"
    );

    if (!userCart) {
      return res.status(200).json({ items: [] });
    }

    res.status(200).json(userCart);
  } catch (err) {
    res.status(500).json({
      message: "Get cart items failed",
      error: err.message,
    });
  }
};

module.exports = { addToCart, removeItem, getCartItems };