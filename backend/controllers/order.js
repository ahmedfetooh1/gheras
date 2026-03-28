const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");
const Payment = require("../models/payment");
const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

//POST /api/orders
// إنشاء order من الـ cart (checkout)
const createOrder = catchAsync(async (req, res, next) => {
  const { paymentMethod = "cash", phone, address } = req.body;

  if (!phone) {
    return next(new AppError("Phone number is required", 400));
  }

  // جيب الـ cart
  const cart = await Cart.findOne({ user: req.user.id });
  if (!cart || cart.items.length === 0) {
    return next(new AppError("Your cart is empty", 400));
  }

  // تحقق من الـ stock لكل item قبل الـ order
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product || !product.isActive) {
      return next(
        new AppError(`Product "${item.name}" is no longer available`, 400)
      );
    }
    if (product.stock < item.quantity) {
      return next(
        new AppError(
          `Insufficient stock for "${item.name}". Available: ${product.stock}`,
          400
        )
      );
    }
  }

  // إنشاء الـ order
  const orderData = {
    user: req.user.id,
    items: cart.items,
    subtotal: cart.subtotal,
    shipping: 0,
    total: cart.totalPrice,
    paymentMethod,
    phone,
    address: address,
  };

  // لو الدفع مش cash، ننشئ payment record ونربطه بالـ order
  if (paymentMethod !== "cash") {
    const payment = await Payment.create({
      user: req.user.id,
      method: paymentMethod,
      // Cart model stores final payable amount in `totalPrice`
      amountCents: Math.round((cart.totalPrice || 0) * 100),
      currency: "EGP",
      status: "pending",
    });
    orderData.payment = payment._id;
  }

  const order = await Order.create(orderData);

  // تقليل الـ stock لكل منتج
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  // تفريغ الـ cart بعد الـ order
  cart.items = [];
  cart.subtotal = 0;
  cart.total = 0;
  await cart.save();

  res.status(201).json({ status: "success", data: order });
});

//GET /api/orders
// جيب كل orders الـ user
const getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .populate("items.product", "name images")
    .populate("payment", "status method paymobTransactionId");

  res.status(200).json({ status: "success", results: orders.length, data: orders });
});

//GET /api/orders/:id
// جيب تفاصيل order معينة
const getOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("items.product", "name images")
    .populate("payment", "status method paymobTransactionId");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // تأكد إن الـ user شايف order بتاعته هو بس (أو admin)
  if (order.user.toString() !== req.user.id && req.user.role !== "admin") {
    return next(new AppError("You are not authorized to view this order", 403));
  }

  res.status(200).json({ status: "success", data: order });
});

//PATCH /api/orders/:id/cancel
// إلغاء order (للـ user)
const cancelOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  if (order.user.toString() !== req.user.id) {
    return next(new AppError("You are not authorized to cancel this order", 403));
  }

  if (!["pending", "processing"].includes(order.status)) {
    return next(
      new AppError(
        `Order cannot be cancelled because it is already "${order.status}"`,
        400
      )
    );
  }

  // إرجاع الـ stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  order.status = "cancelled";
  await order.save();

  // لو فيه payment مرتبط بالـ order، نعالجه
  if (order.payment) {
    const paymentDoc = await Payment.findById(order.payment);
    if (paymentDoc) {
      if (paymentDoc.status === "paid") {
        // Refund logic
        const refundAmount = paymentDoc.amountCents / 100;
        await User.findByIdAndUpdate(order.user, {
          $inc: { balance: refundAmount },
        });
        paymentDoc.status = "refunded";
      } else {
        paymentDoc.status = "failed";
      }
      await paymentDoc.save();
    }
  }

  res.status(200).json({ status: "success", data: order });
});

// ──────────────────────────────────────────────────────────────────
// Admin endpoints
// ──────────────────────────────────────────────────────────────────

//GET /api/orders/admin/all
// جيب كل الـ orders (للـ admin)
const getAllOrders = catchAsync(async (req, res, next) => {
  const filter = {};

  // فلترة اختيارية بالـ status
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .populate("user", "name email")
    .populate("items.product", "name images")
    .populate("payment", "status method");

  res.status(200).json({ status: "success", results: orders.length, data: orders });
});

//PATCH /api/orders/admin/:id/status
// تغيير status الـ order (للـ admin)
// الترتيب المسموح: pending → processing → shipped → delivered
const updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;

  const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!status || !allowedStatuses.includes(status)) {
    return next(
      new AppError(`Invalid status. Allowed: ${allowedStatuses.join(", ")}`, 400)
    );
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // لو الـ order ملغية أو متسلمة مينفعش يتغير
  if (["cancelled", "delivered"].includes(order.status)) {
    return next(
      new AppError(`Order is already "${order.status}" and cannot be changed`, 400)
    );
  }

  // Validation: Ensure that an order cannot be moved to shipped unless its status is processing
  if (status === "shipped" && order.status !== "processing") {
    return next(
      new AppError('Order must be in "processing" status to be shipped', 400)
    );
  }

  // لو الأدمن بيلغي الـ order، ارجع الـ stock
  if (status === "cancelled") {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    if (order.payment) {
      const paymentDoc = await Payment.findById(order.payment);
      if (paymentDoc) {
        if (paymentDoc.status === "paid") {
          // Refund logic
          const refundAmount = paymentDoc.amountCents / 100;
          await User.findByIdAndUpdate(order.user, {
            $inc: { balance: refundAmount },
          });
          paymentDoc.status = "refunded";
        } else {
          paymentDoc.status = "failed";
        }
        await paymentDoc.save();
      }
    }
  }

  order.status = status;
  await order.save();

  res.status(200).json({ status: "success", data: order });
});

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};
