const express = require("express");
const router = express.Router();

const blogController = require("../controllers/blogController");
const upload = require("../middlewares/upload");

const { authentication, authorization } = require("../middlewares/authentication");

// Create Blog (Admin only)
router.post(
  "/blogs",
  authentication,
  authorization("admin"),
  upload.single("image"),
  blogController.createBlog
);

// Get All Blogs (Public)
router.get("/blogs", blogController.getBlogs);

// Get Blog by Slug (Public)
router.get("/blogs/:slug", blogController.getBlogBySlug);

// Update Blog (Admin only)
router.put(
  "/blogs/:id",
  authentication,
  authorization("admin"),
  upload.single("image"),
  blogController.updateBlog
);

// Delete Blog (Admin only)
router.delete(
  "/blogs/:id",
  authentication,
  authorization("admin"),
  blogController.deleteBlog
);

module.exports = router;