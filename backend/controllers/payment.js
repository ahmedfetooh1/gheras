
const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/payment');
const Product = require('../models/product');
const Order = require('../models/order');

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


async function createOrder(authToken, amount) {
    const response = await axios.post(
        `${PAYMOB_API_URL}/ecommerce/orders`,
        {
            auth_token: authToken,
            delivery_needed: "false",
            amount_cents: amount * 100, 
            currency: "EGP",
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
    const paymobOrderId = await createOrder(authToken, amount);
    const paymentKey = await createPaymentKey(authToken, paymobOrderId, amount, integrationId);

    // حدّث الـ Payment الموجود بدل ما تنشئ واحد جديد
    await Payment.findByIdAndUpdate(order.payment, {
      paymobOrderId,
      method,
    });

    const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;

    res.status(200).json({ success: true, iframeUrl });
  } catch (error) {
    console.error("Error creating payment:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}

function verifyPaymobHmac(hmac, body) {
    if (!HMAC_KEY) {
        return false;
    }

    const obj = body.obj;
    if (!obj) return false;

    // Ordered fields strictly per Paymob documentation
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
            if(typeof value === 'boolean') {
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
    const hmac = req.query.hmac;
    if (!hmac) {
      return res.status(400).json({ success: false, error: 'Missing hmac' });
    }

    const isValid = verifyPaymobHmac(hmac, req.body);
    if (!isValid) {
      return res.status(403).json({ success: false, error: 'Invalid HMAC' });
    }

    const obj = req.body.obj || {};
    const paymobOrderId = obj.order?.id;
    const paymobTransactionId = obj.id;
    const success = obj.success === true || obj.success === 'true';

    if (paymobOrderId) {
      // 1. حدّث الـ Payment
      const payment = await Payment.findOneAndUpdate(
        { paymobOrderId },
        {
          status: success ? 'paid' : 'failed',
          paymobTransactionId,
          rawWebhookData: req.body,
        },
        { new: true }
      );

      // 2. ✅ حدّث الـ Order المرتبط
      if (payment) {
        await Order.findOneAndUpdate(
          { payment: payment._id },
          { status: success ? 'processing' : 'cancelled' }
        );
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in Paymob webhook:', error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { createPayment, paymobWebhook };

            