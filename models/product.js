const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
    },

    finalPrice: {
      type: Number,
    },

    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },

    images: [
      {
        type: String,
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Calculate finalPrice before saving
productSchema.pre("save", function () {
  this.finalPrice = this.price - this.discount;
});

module.exports = mongoose.model("Product", productSchema);
