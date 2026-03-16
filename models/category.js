const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 50,
    },

    // Optional slug for SEO-friendly URLs
    slug: {
      type: String,
      unique: true,
      sparse: true,
    },

    description: {
      type: String,
      maxlength: 500,
    },

    image: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
