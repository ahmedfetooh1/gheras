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
   default: 0,
   min: 0,
   max: 100
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

// auto-calculate finalPrice before saving
// productSchema.pre('save', function (next) {
//   this.finalPrice = this.price - (this.price * this.discountPercent / 100)
//   next()
// })

productSchema.pre('save', function () {
  if(this.discountPercent){
    this.finalPrice = this.price - (this.price * this.discountPercent / 100);
  }else{
    this.finalPrice = this.price;
  }
});

module.exports = mongoose.model("Product", productSchema);