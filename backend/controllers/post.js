const Post = require("../models/post");
const catchAsync = require("../utils/catchAsync"); 
const AppError = require("../utils/appError");   

// 1. Create Post
exports.createPost = catchAsync(async (req, res, next) => {
    const post = await Post.create({
        title: req.body.title,
        content: req.body.content,
        author: req.body.author,
        status: "pending" 
    });

    res.status(201).json({
        status: "success",
        message: "Post created and waiting for admin approval",
        data: { post }
    });
});

// 2. Get All Posts (approved only + existing old posts without status)
exports.getAllPosts = catchAsync(async (req, res, next) => {
    const posts = await Post.find({
        $or: [
            { status: "approved" },
            { status: { $exists: false } }
        ]
    })
        .populate("author")
        .populate("comments");

    res.status(200).json({
        status: "success",
        results: posts.length,
        data: { posts }
    });
});

// 3. Get Pending Posts (for admin)
exports.getPendingPosts = catchAsync(async (req, res, next) => {
    const posts = await Post.find({ status: "pending" }).populate("author");

    res.status(200).json({
        status: "success",
        data: { posts }
    });
});

// 4. Get Post By ID
exports.getPostById = catchAsync(async (req, res, next) => {
    const post = await Post.findById(req.params.id)
        .populate("author")
        .populate({
            path: "comments",
            populate: { path: "author" }
        });

    if (!post) {
        return next(new AppError("No post found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        data: { post }
    });
});

// 5. Update Post
exports.updatePost = catchAsync(async (req, res, next) => {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!post) {
        return next(new AppError("No post found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        data: { post }
    });
});

// 6. Delete Post
exports.deletePost = catchAsync(async (req, res, next) => {
    const post = await Post.findByIdAndDelete(req.params.id);

    if (!post) {
        return next(new AppError("No post found with that ID", 404));
    }

    res.status(204).json({
        status: "success",
        data: null
    });
});

// 7. Approve Post (Admin)
exports.approvePost = catchAsync(async (req, res, next) => {
    const post = await Post.findByIdAndUpdate(
        req.params.id,
        { status: "approved" },
        { new: true }
    );

    if (!post) {
        return next(new AppError("No post found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        message: "Post approved",
        data: { post }
    });
});

// 8. Reject Post (Admin)
exports.rejectPost = catchAsync(async (req, res, next) => {
    const post = await Post.findByIdAndUpdate(
        req.params.id,
        { status: "rejected" },
        { new: true }
    );

    if (!post) {
        return next(new AppError("No post found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        message: "Post rejected",
        data: { post }
    });
});