const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
{
 name: { type: String, required: true },

 description: String,

 category: {
   type: mongoose.Schema.Types.ObjectId,
   ref: "Category",
 },

 price: { type: Number, required: true },

 discountPercent: {
   type: Number,
   default: 0
 },

 finalPrice: Number,

 stock: {
   type: Number,
   default: 0
 },

 images: [String],

 relatedProducts: [
  {
   type: mongoose.Schema.Types.ObjectId,
   ref: "Product"
  }
 ],


 isActive: {
   type: Boolean,
   default: true
 }

},
{ timestamps: true }
)

module.exports = mongoose.model("Product", productSchema);