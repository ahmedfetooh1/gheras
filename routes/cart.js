const express = require("express");
const router = express.Router();
const {
  addToCart,
  removeItem,
  getCartItems,
} = require("../controllers/cart");
const { authentication } = require("../middlewares/authentication");

router.post("/add", authentication, addToCart);
router.delete("/remove/:productId", authentication, removeItem);
router.get("/getItems", authentication, getCartItems);

module.exports = router;
