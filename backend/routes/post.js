const express = require("express");
const router = express.Router();
const postController = require("../controllers/post");

const { authentication, authorization } = require("../middlewares/authentication");


// Create Post
router.post("/", authentication, postController.createPost);

// Get All Approved Posts
router.get("/", postController.getAllPosts);

// Admin: Get Pending Posts
router.get("/pending", authentication, authorization("admin"), postController.getPendingPosts);

// Get Post By ID
router.get("/:id", postController.getPostById);

// Update Post
router.put("/:id", authentication, postController.updatePost);

// Delete Post
router.delete("/:id", authentication, postController.deletePost);


// Admin: Approve Post
router.put("/approve/:id", authentication, authorization("admin"), postController.approvePost);


// Admin: Reject Post
router.put("/reject/:id", authentication, authorization("admin"), postController.rejectPost);


module.exports = router;