const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment");


router.post("/", commentController.createComment);

router.get("/post/:postId", commentController.getCommentsByPost);

router.delete("/:id", commentController.deleteComment);


module.exports = router;