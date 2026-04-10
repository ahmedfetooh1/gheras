
const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/payment');
const Product = require('../models/product');
const Order = require('../models/order');
const SucceededOrder = require('../models/succeededOrder');

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_CARD_INTEGRATION_ID = process.env.PAYMOB_CARD_INTEGRATION_ID;
const PAYMOB_WALLET_INTEGRATION_ID = process.env.PAYMOB_WALLET_INTEGRATION_ID;
const PAYMOB_API_URL = process.env.PAYMOB_API_URL;
const PAYMOB_CARD_IFRAME_ID = process.env.PAYMOB_CARD_IFRAME_ID;
const PAYMOB_WALLET_IFRAME_ID = process.env.PAYMOB_WALLET_IFRAME_ID;
const HMAC_KEY = process.env.HMAC_KEY;


async function getAuthToken() {
  const response = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
    api_key: PAYMOB_API_KEY,
  });
  return response.data.token;
}


async function createOrder(authToken, amount, merchantOrderId) {
  const response = await axios.post(
    `${PAYMOB_API_URL}/ecommerce/orders`,
    {
      auth_token: authToken,
      delivery_needed: "false",
      amount_cents: amount * 100,
      currency: "EGP",
      merchant_order_id: merchantOrderId ? String(merchantOrderId) : undefined,
      items: [],
    }
  );
  return response.data.id;
}

async function createPaymentKey(authToken, orderId, amount, integrationId) {
  const response = await axios.post(
    `${PAYMOB_API_URL}/acceptance/payment_keys`,
    {
      auth_token: authToken,
      amount_cents: amount * 100,
      expiration: 3600,
      order_id: orderId,
      billing_data: {
        first_name: "Customer",
        last_name: "User",
        phone_number: "01000000000",
        email: "customer@example.com",
        country: "Na",
        city: "Na",
        street: "Na",
        building: "Na",
        floor: "Na",
        apartment: "Na",
      },
      currency: "EGP",
      integration_id: integrationId,
    }
  );
  return response.data.token;
}

async function createPayment(req, res) {
  try {
    const { orderId, method: rawMethod = 'card' } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, error: "Order ID is required" });
    }

    // جيب الـ Order مع الـ Payment المرتبط
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // تأكد إن الـ order بتاعت الـ user ده
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: "Unauthorized" });
    }

    const method = String(rawMethod).toLowerCase().trim();
    const amount = order.total; // بالجنيه

    let integrationId = method === 'wallet'
      ? PAYMOB_WALLET_INTEGRATION_ID
      : PAYMOB_CARD_INTEGRATION_ID;
    let iframeId = method === 'wallet'
      ? PAYMOB_WALLET_IFRAME_ID
      : PAYMOB_CARD_IFRAME_ID;

    const authToken = await getAuthToken();
    const paymobOrderId = await createOrder(authToken, amount, order._id);
    const paymentKey = await createPaymentKey(authToken, paymobOrderId, amount, integrationId);

    // لو مفيش payment موجود، أنشئ واحد جديد
    let paymentId = order.payment;
    if (!paymentId) {
      const newPayment = new Payment({
        user: order.user,
        method,
        amountCents: amount * 100,
        currency: 'EGP',
        paymobOrderId,
        status: 'pending'
      });
      await newPayment.save();
      paymentId = newPayment._id;
      
      // ربط الـ Payment بالـ Order
      order.payment = paymentId;
      await order.save();
    } else {
      // حدّث الـ Payment الموجود
      await Payment.findByIdAndUpdate(order.payment, {
        paymobOrderId,
        method,
      });
    }

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;

    res.status(200).json({ success: true, iframeUrl });
  } catch (error) {
    console.error("Error creating payment:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

function parsePaymobBody(body) {
  if (!body) return body;
  if (Buffer.isBuffer(body)) {
    try {
      return JSON.parse(body.toString('utf8'));
    } catch {
      return body;
    }
  }
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

/** Paymob may send `obj` (full transaction) or a minimal test payload; normalize to one transaction object. */
function extractPaymobTransactionObject(body) {
  const b = parsePaymobBody(body);
  if (!b || typeof b !== 'object') return null;
  if (b.obj && typeof b.obj === 'object') return b.obj;
  if (b.type === 'TRANSACTION' && b.obj) return b.obj;
  if (b.order && (b.success !== undefined || b.id !== undefined)) return b;
  return null;
}

async function findPaymentForSync({ paymobOrderId, merchantOrderId, paymobTransactionId }) {
  let payment = null;

  if (paymobOrderId != null && paymobOrderId !== '') {
    const oid = Number(paymobOrderId);
    if (!Number.isNaN(oid)) {
      payment = await Payment.findOne({ paymobOrderId: oid });
    }
  }

  if (!payment && merchantOrderId) {
    const localOrder = await Order.findById(String(merchantOrderId));
    if (localOrder?.payment) {
      payment = await Payment.findById(localOrder.payment);
    }
  }

  if (!payment && paymobTransactionId != null && paymobTransactionId !== '') {
    const tid = Number(paymobTransactionId);
    if (!Number.isNaN(tid)) {
      payment = await Payment.findOne({ paymobTransactionId: tid });
    }
  }

  return payment;
}

async function applyPaymentResult(payment, { success, paymobOrderId, paymobTransactionId, rawWebhookData }) {
  if (!payment) return null;
  const update = {
    status: success ? 'paid' : 'failed',
    rawWebhookData: rawWebhookData || undefined,
  };
  if (paymobTransactionId != null && paymobTransactionId !== '') {
    const tid = Number(paymobTransactionId);
    if (!Number.isNaN(tid)) update.paymobTransactionId = tid;
  }
  if (paymobOrderId != null && paymobOrderId !== '') {
    const oid = Number(paymobOrderId);
    if (!Number.isNaN(oid)) update.paymobOrderId = oid;
  }
  return Payment.findByIdAndUpdate(payment._id, update, { new: true });
}

async function syncOrderAfterPaymentUpdate(paymentDoc, success) {
  if (!paymentDoc) return { orderUpdated: false, orderId: null };

  const autoDeliverOnPayment = String(process.env.AUTO_DELIVER_ON_PAYMENT || 'true') === 'true';
  const nextStatus = success ? (autoDeliverOnPayment ? 'delivered' : 'paid') : 'cancelled';

  // find the order first to have access to items (for stock return)
  const order = await Order.findOne({ payment: paymentDoc._id });
  if (!order) return { orderUpdated: false, orderId: null };

  // If status was already what we want, just return (avoid duplicate logic)
  if (order.status === nextStatus) {
    return { orderUpdated: true, orderId: order._id, orderStatus: order.status };
  }

  // Handle stock return if payment failed
  if (!success) {
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }
  }

  // Update order status
  order.status = nextStatus;
  await order.save(); // Using save() instead of findOneAndUpdate to trigger any potential hooks

  if (nextStatus === 'delivered') {
    await SucceededOrder.updateOne(
      { orderId: order._id },
      {
        $set: {
          orderId: order._id,
          total: order.total,
          user: order.user,
          deliveredAt: new Date()
        }
      },
      { upsert: true }
    );
  }

  return { orderUpdated: true, orderId: order._id, orderStatus: order.status };
}

function verifyPaymobHmac(hmac, body) {
  // In production, HMAC is mandatory.
  // In local/dev testing, allow webhook processing if HMAC key is missing.
  if (!HMAC_KEY) {
    return process.env.NODE_ENV !== 'production';
  }

  const parsed = parsePaymobBody(body);
  const obj = parsed?.obj;
  if (!obj) return false;

  // Ordered fields  per Paymob documentation
  const expectedKeys = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order.id",
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "source_data.type",
    "success"
  ];

  let concatenatedString = "";

  expectedKeys.forEach((key) => {
    const keysArray = key.split(".");
    let value = obj;

    keysArray.forEach((k) => {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        value = undefined;
      }
    });

    // Add true/false boolean or value
    if (value !== undefined && value !== null) {
      if (typeof value === 'boolean') {
        concatenatedString += value ? "true" : "false";
      } else {
        concatenatedString += value.toString();
      }
    }
  });

  const computed = crypto
    .createHmac("sha512", HMAC_KEY)
    .update(concatenatedString)
    .digest("hex");

  return computed === hmac;
}

async function paymobWebhook(req, res) {
  try {
    const parsedBody = parsePaymobBody(req.body);
    const hmac = req.query.hmac || parsedBody?.hmac;
    const isProduction = process.env.NODE_ENV === 'production';

    if (!hmac) {
      if (isProduction) {
        return res.status(400).json({ success: false, error: 'Missing hmac' });
      }
      console.warn('[paymobWebhook] Missing hmac in non-production mode, proceeding for local testing.');
    }

    const isValid = verifyPaymobHmac(hmac, parsedBody);
    if (!isValid) {
      if (isProduction) {
        return res.status(403).json({ success: false, error: 'Invalid HMAC' });
      }
      console.warn('[paymobWebhook] Invalid HMAC in non-production mode, proceeding for local testing.');
    }

    const obj = extractPaymobTransactionObject(parsedBody) || {};
    const paymobOrderId =
      obj.order?.id ??
      obj.order_id ??
      parsedBody?.obj?.order?.id;
    const paymobTransactionId = obj.id ?? obj.transaction_id;
    const success = obj.success === true || obj.success === 'true';
    const merchantOrderId =
      obj.order?.merchant_order_id ??
      parsedBody?.obj?.order?.merchant_order_id ??
      parsedBody?.merchant_order_id;

    let payment = await findPaymentForSync({
      paymobOrderId,
      merchantOrderId,
      paymobTransactionId,
    });

    if (payment) {
      payment = await applyPaymentResult(payment, {
        success,
        paymobOrderId,
        paymobTransactionId,
        rawWebhookData: parsedBody,
      });
    }

    const syncResult = await syncOrderAfterPaymentUpdate(payment, success);

    return res.status(200).json({
      success: true,
      paymentUpdated: !!payment,
      paymentId: payment?._id || null,
      orderUpdated: syncResult.orderUpdated,
      orderId: syncResult.orderId,
      orderStatus: syncResult.orderStatus,
    });
  } catch (error) {
    console.error('Error in Paymob webhook:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Browser redirect after Paymob checkout (configure this URL in Paymob as "redirect / return").
 * Query params vary; we match by order_id (Paymob), merchant_order_id (your Order _id), id (transaction), or single pending payment with same amount_cents.
 */
async function paymobReturn(req, res) {
  try {
    const q = req.query;
    const successFlag = q.success === 'true' || q.success === true || q.success === '1';
    const txnCode = (q.txn_response_code || '').toString().toUpperCase();
    const txnOk = txnCode === '' || txnCode === 'APPROVED';
    const isPaid = successFlag && txnOk;

    const paymobOrderId = q.order_id || q['order.id'] || q.order;
    const merchantOrderId = q.merchant_order_id;
    const paymobTransactionId = q.id || q.transaction_id;

    let payment = await findPaymentForSync({
      paymobOrderId,
      merchantOrderId,
      paymobTransactionId,
    });

    if (!payment && q.amount_cents) {
      const cents = Number(q.amount_cents);
      if (!Number.isNaN(cents)) {
        const pending = await Payment.find({ status: 'pending', amountCents: cents });
        if (pending.length === 1) payment = pending[0];
      }
    }

    if (!payment) {
      // If payment not found, still redirect to frontend with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      return res.redirect(`${frontendUrl}/shop/checkout/payment?success=false&error=Payment not found`);
    }

    const updated = await applyPaymentResult(payment, {
      success: isPaid,
      paymobOrderId: paymobOrderId != null && paymobOrderId !== '' ? paymobOrderId : payment.paymobOrderId,
      paymobTransactionId,
      rawWebhookData: { source: 'redirect', query: q },
    });

    const syncResult = await syncOrderAfterPaymentUpdate(updated, isPaid);

    // Redirect to frontend with payment result
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const redirectUrl = `${frontendUrl}/shop/checkout/payment/${syncResult.orderId}?success=${isPaid}&orderStatus=${syncResult.orderStatus}`;
    
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in Paymob return:', error.message);
    // On error, redirect to frontend with failure
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    return res.redirect(`${frontendUrl}/shop/checkout/payment?success=false&error=${encodeURIComponent(error.message)}`);
  }
}

function paymobApprove(req, res) {
  const success = req.query.success;
  const isSuccess = success === 'true' || success === true || success === '1';

  if (isSuccess) {
    return res
      .status(200)
      .send('Payment approved successfully. You can return to the app.');
  }

  return res
    .status(200)
    .send('Payment not approved. Please try again.');
}

module.exports = { createPayment, paymobWebhook, paymobApprove, paymobReturn };

