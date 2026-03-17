const express = require("express");
const router = express.Router();


const { authentication,authorization } = require("../middlewares/authentication");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cart");

// كل الـ cart routes محتاجة الـ user يكون logged in
router.use(authentication);

router.get("/", getCart);          // جيب الـ cart
router.post("/", addToCart);       // أضف item للـ cart
router.put("/:itemId", updateCartItem);      // عدّل quantity لـ item
router.delete("/:itemId", removeCartItem);   // احذف item من الـ cart
router.delete("/", clearCart);     // فرّغ الـ cart كلها

module.exports = router;