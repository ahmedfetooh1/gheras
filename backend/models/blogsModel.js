const mongoose = require("mongoose");
const slugify = require("slugify");

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Title is required"],
        trim: true
    },

    slug: {
        type: String,
        unique: true,
        lowercase: true,
        index: true
    },

    content: {
        type: String,
        required: [true, "Blog content is required"]
    },

    image: {
        type: String
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Author is required"]
    },

    tags: [String],

    category: {
        type: String,
        required: [true, "Category is required"]
    },

    isPublished: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

blogSchema.pre("save", function () {
    if (!this.isModified("title")) return;

    if (this.title) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^\u0600-\u06FF\w\s]/g, "")
            .replace(/\s+/g, "-");
    } else {
        this.slug = "blog-" + Date.now();
    }
});

module.exports = mongoose.model("Blog", blogSchema);