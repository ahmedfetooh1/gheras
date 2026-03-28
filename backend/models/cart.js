const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  name: String,
  price: Number, // السعر الأصلي
  discountPercent: { type: Number, default: 0 },
  finalPrice: Number, // السعر بعد الخصم
  quantity: {
    type: Number,
    default: 1,
    min: 1
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  // Backward-compat: some existing DB indexes are on `userId`
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
    unique: true,
    default: null
  },
  items: [cartItemSchema],
  totalQty: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 }, // إجمالي السعر قبل الخصم
  totalDiscount: { type: Number, default: 0 }, // إجمالي ما وفره المستخدم
  totalPrice: { type: Number, default: 0 } // السعر النهائي المطلوب دفعه
}, { timestamps: true });



// Middleware لحساب الإجماليات تلقائياً قبل الحفظ
cartSchema.pre("save", function (next) {
  // Keep `userId` in sync to satisfy unique indexes.
  if (!this.userId && this.user) {
    this.userId = this.user;
  }

  this.totalQty = this.items.reduce((sum, item) => sum + item.quantity, 0);
  
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  this.totalPrice = this.items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
  
  this.totalDiscount = this.subtotal - this.totalPrice;
  
  // Some Mongoose versions may not provide `next` for sync hooks.
  if (typeof next === "function") next();
});

module.exports = mongoose.model("Cart", cartSchema);