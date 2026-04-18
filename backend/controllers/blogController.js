const Blog = require("../models/blogsModel");
const cloudinary = require("../config/cloudinary");
const catchAsync = require("../utils/catchAsync");

// Create Blog
exports.createBlog = catchAsync(async (req, res, next) => {

    if (!req.body.title || !req.body.content || !req.body.category) {
        const error = new Error("title, content, category required");
        error.statusCode = 400;
        return next(error);
    }

    let imageUrl = "";

    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        imageUrl = result.secure_url;
    }

    const blog = await Blog.create({
        title: req.body.title,
        content: req.body.content,
        category: req.body.category,
        tags: req.body.tags ? req.body.tags.split(",") : [],
        image: imageUrl,
        author: req.user ? req.user.id : null
    });

    res.status(201).json({
        message: "Blog created successfully",
        data: blog
    });
});

// Get All Blogs
exports.getBlogs = catchAsync(async (req, res, next) => {

    const blogs = await Blog.find()
        .populate("author", "name email");

    res.status(200).json({
        results: blogs.length,
        data: blogs
    });
});

// Get Blog by Slug
exports.getBlogBySlug = catchAsync(async (req, res, next) => {

    const blog = await Blog.findOne({ slug: req.params.slug })
        .populate("author", "name email");

    if (!blog) {
        const error = new Error("Blog not found");
        error.statusCode = 404;
        return next(error);
    }

    res.status(200).json(blog);
});

// Update Blog
exports.updateBlog = catchAsync(async (req, res, next) => {

    const blog = await Blog.findById(req.params.id);

    if (!blog) {
        const error = new Error("Blog not found");
        error.statusCode = 404;
        return next(error);
    }

    if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path);
        blog.image = result.secure_url;
    }

    blog.title = req.body.title || blog.title;
    blog.content = req.body.content || blog.content;
    blog.category = req.body.category || blog.category;
    blog.tags = req.body.tags ? req.body.tags.split(",") : blog.tags;

    if (req.body.isPublished !== undefined) {
        blog.isPublished = req.body.isPublished;
    }

    await blog.save();

    res.status(200).json({
        message: "Blog updated",
        data: blog
    });
});

// Delete Blog
exports.deleteBlog = catchAsync(async (req, res, next) => {

    const blog = await Blog.findByIdAndDelete(req.params.id);

    if (!blog) {
        const error = new Error("Blog not found");
        error.statusCode = 404;
        return next(error);
    }

    res.status(200).json({
        message: "Blog deleted successfully"
    });
});