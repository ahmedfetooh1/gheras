const Comment = require("../models/comment");
const Post = require("../models/post");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// 1. Create Comment
exports.createComment = catchAsync(async (req, res, next) => {
    
    const post = await Post.findById(req.body.post);
    if (!post) {
        return next(new AppError("No post found with that ID to comment on", 404));
    }

    const comment = await Comment.create({
        text: req.body.text,
        author: req.body.author,
        post: req.body.post
    });

    
    await Post.findByIdAndUpdate(
        req.body.post,
        { $push: { comments: comment._id } }
    );

    res.status(201).json({
        status: "success",
        data: { comment }
    });
});

// 2. Get Comments for Post
exports.getCommentsByPost = catchAsync(async (req, res, next) => {
    const comments = await Comment.find({ post: req.params.postId })
        .populate("author");

    res.status(200).json({
        status: "success",
        results: comments.length,
        data: { comments }
    });
});

// 3. Delete Comment
exports.deleteComment = catchAsync(async (req, res, next) => {
    const comment = await Comment.findByIdAndDelete(req.params.id);

    if (!comment) {
        return next(new AppError("No comment found with that ID", 404));
    }

    
    await Post.findByIdAndUpdate(comment.post, {
        $pull: { comments: req.params.id }
    });

    res.status(204).json({
        status: "success",
        data: null
    });
});