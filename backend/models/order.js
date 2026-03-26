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
    enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
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

  phone:{
    type: String,
    required:true
  },
  
  address: {
  city: { type: String, required: true },
  street: { type: String, required: true }
}

}, { timestamps: true })

orderSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'delivered') {
    try {
      // Require the model dynamically to avoid circular dependencies
      const SucceededOrder = require('./succeededOrder');
      // Use updateOne with upsert to avoid duplicate errors if the hook runs multiple times
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
  next();
});

module.exports = mongoose.model("Order", orderSchema)