const mongoose = require("mongoose")

const orderItemSchema = new mongoose.Schema({

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  name: String,

  price: Number,

  discountPercent: Number,

  finalPrice: Number,

  quantity: {
    type: Number,
    required: true,
    min: 1
  }

})

const orderSchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  items: [orderItemSchema],

  subtotal: {
    type: Number,
    required: true
  },

  shipping: {
    type: Number,
    default: 0
  },

  total: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "paid", "confirmed", "processing", "shipped", "delivered", "cancelled"],
    default: "pending"
  },

  paymentMethod: {
    type: String,
    enum: ["cash", "card", "wallet"],
    default: "cash"
  },

  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment"
  },

  phone: {
    type: String,
    required: true
  },

  address: {
    city: { type: String, required: true },
    street: { type: String, required: true }
  }

}, { timestamps: true })

orderSchema.pre('save', async function (next) {
  if (this.isModified('status') && this.status === 'delivered') {
    try {
      const SucceededOrder = require('./succeededOrder');
      await SucceededOrder.updateOne(
        { orderId: this._id },
        {
          $set: {
            orderId: this._id,
            total: this.total,
            user: this.user,
            deliveredAt: Date.now()
          }
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('Error in order presave hook:', err);
    }
  }
  if (typeof next === 'function') next();
});

// Sync deletion: Remove from SucceededOrder when an order is deleted
orderSchema.pre('findOneAndDelete', async function (next) {
  const docToDel = await this.model.findOne(this.getQuery());
  if (docToDel) {
    try {
      const SucceededOrder = require('./succeededOrder');
      await SucceededOrder.deleteOne({ orderId: docToDel._id });
    } catch (err) {
      console.error('Error in order pre-delete hook:', err);
    }
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema)