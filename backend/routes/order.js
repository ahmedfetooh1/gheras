const express = require("express");
const router = express.Router();

const { authentication, authorization } = require("../middlewares/authentication");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
} = require("../controllers/order");

// كل الـ order routes محتاجة الـ user يكون logged in
router.use(authentication);

// User routes
router.post("/", createOrder);             // إنشاء order (checkout)
router.get("/", getMyOrders);              // جيب orders الـ user
router.get("/:id", getOrderById);          // تفاصيل order معينة
router.patch("/:id/cancel", cancelOrder);  // إلغاء order

// Admin routes
router.get("/admin/all", authorization("admin"), getAllOrders);          // جيب كل الـ orders
router.patch("/admin/:id/status", authorization("admin"), updateOrderStatus);  // تغيير status

module.exports = router;
