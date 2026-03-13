const mongoose = require("mongoose")

const orderItemSchema = new mongoose.Schema({

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  name: String,

  price: Number,

  discountPercent: Number,

  finalPrice: Number,

  quantity: {
    type: Number,
    required: true,
    min: 1
  }

})

const orderSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [orderItemSchema],

  subtotal: {
    type: Number,
    required: true
  },

  shipping: {
    type: Number,
    default: 0
  },

  total: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
    default: "pending"
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "card"],
    default: "cash"
  },

  address: {
    city: String,
    street: String,
    phone: String
  }

}, { timestamps: true })

module.exports = mongoose.model("Order", orderSchema)