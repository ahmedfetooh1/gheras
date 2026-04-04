const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
{
  name: { type: String, required: true, trim: true },

  description: { type: String, required: true, trim: true },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  price: { type: Number, required: true, min: 0 },

  costPrice: { type: Number, required: true, default: 0, min: 0 },

  discountPercent: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  finalPrice: Number,

  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
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

productSchema.pre('save', function () {
  if (this.price !== undefined) {
    this.finalPrice = this.price - (this.price * (this.discountPercent || 0) / 100);
  }
  next();
});

module.exports = mongoose.model("Product", productSchema);