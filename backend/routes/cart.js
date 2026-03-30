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

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:itemId", updateCartItem);
router.delete("/:itemId", removeCartItem);
router.delete("/", clearCart);

module.exports = router;