const mongoose = require("mongoose")

const cartItemSchema = new mongoose.Schema({

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
    default: 1,
    min: 1
  }

})

const cartSchema = new mongoose.Schema(
{

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [cartItemSchema],

  //Subtotal + Shipping - Discounts = Total
  subtotal: {
    type: Number,
    default: 0
  },

  total: {
    type: Number,
    default: 0
  }

},
{ timestamps: true }
)

module.exports = mongoose.model("Cart", cartSchema)