const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    qty: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema({
  items: {
    type: [cartItemSchema],
    default: [],
  },

  totalQty: {
    type: Number,
    default: 0,
    min: 0,
  },

  subtotal: {
    type: Number,
    default: 0,
    min: 0,
  },

  discountTotal: {
    type: Number,
    default: 0,
    min: 0,
  },

  totalCost: {
    type: Number,
    default: 0,
    min: 0,
  },

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Cart", cartSchema);

