
const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/payment');
const Product = require('../models/product');
const User = require('../models/user');

const PAYMOB_API_KEY = process.env.PAYMOB_API_KEY;
const PAYMOB_CARD_INTEGRATION_ID = process.env.PAYMOB_CARD_INTEGRATION_ID;
const PAYMOB_API_URL = process.env.PAYMOB_API_URL;
const PAYMOB_CARD_IFRAME_ID = process.env.PAYMOB_CARD_IFRAME_ID;
const HMAC_KEY = process.env.HMAC_KEY;


async function getAuthToken() {
    const response = await axios.post(`${PAYMOB_API_URL}/auth/tokens`, {
        api_key: PAYMOB_API_KEY,
    });
    return response.data.token;
}


async function createOrder(authToken, amountCents) {
    const response = await axios.post(
        `${PAYMOB_API_URL}/ecommerce/orders`,
        {
            auth_token: authToken,
            delivery_needed: "false",
            amount_cents: amountCents,
            currency: "EGP",
            items: [],
        }
    );
    return response.data.id; 
}

async function createPaymentKey(
    authToken,
    orderId,
    amountCents,
    integrationId,
    billingData
) {
    const response = await axios.post(
        `${PAYMOB_API_URL}/acceptance/payment_keys`,
        {
            auth_token: authToken,
            amount_cents: amountCents,
            expiration: 3600,
            order_id: orderId,
            billing_data: billingData,
            currency: "EGP",
            integration_id: integrationId,
        }
    );
    return response.data.token; 
}

async function createPayment(req, res) {
    try {
        const userId = req.user?.id || req.userId || null;
        const { productId, quantity = 1 } = req.body;

        if (!userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }

        if (!productId) {
            return res.status(400).json({ success: false, error: 'productId is required' });
        }

        if (quantity <= 0) {
            return res.status(400).json({ success: false, error: 'quantity must be greater than 0' });
        }

        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }

        // get data user from database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // billing_data  
        const billingData = {
            first_name: user.firstName || "Customer",
            last_name: user.lastName || "User",
            phone_number: "01000000000",
            email: user.email || "customer@example.com",
            country: "Na",
            city: "Na",
            street: "Na",
            building: "Na",
            floor: "Na",
            apartment: "Na",
        };

        // استخدم السعر بعد الخصم لو موجود
        const unitPrice = product.finalPrice ?? product.price;
        const rawAmount = unitPrice * quantity;
        const amountCents = Math.round(rawAmount * 100);

        const authToken = await getAuthToken();
        const orderId = await createOrder(authToken, amountCents);
        const paymentKey = await createPaymentKey(
            authToken,
            orderId,
            amountCents,
            PAYMOB_CARD_INTEGRATION_ID,
            billingData
        );

        const paymentDoc = await Payment.create({
            user: userId,
            method: 'card',
            amountCents,
            currency: 'EGP',
            paymobOrderId: orderId,
            status: 'pending',
        });

        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${PAYMOB_CARD_IFRAME_ID}?payment_token=${paymentKey}`;

        res.status(200).json({
            success: true,
            iframeUrl,
            paymentId: paymentDoc._id,
            amountCents,
        });
    } catch (error) {
        console.error("Error creating payment:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}

function flattenObject(obj, prefix = '', result = {}) {
    Object.keys(obj || {}).forEach((key) => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            flattenObject(value, newKey, result);
        } else {
            result[newKey] = value;
        }
    });
    return result;
}

function verifyPaymobHmac(hmac, body) {
    if (!HMAC_KEY) {
        return false;
    }

    const flat = flattenObject(body);
    delete flat.hmac;

    const keys = Object.keys(flat).sort();
    const concatenated = keys.map((k) => String(flat[k] ?? '')).join('');

    const computed = crypto
        .createHmac('sha512', HMAC_KEY)
        .update(concatenated)
        .digest('hex');

    return computed === hmac;
}

async function paymobWebhook(req, res) {
    try {
        // Paymob webhook is usually POST. Allow GET for quick manual check.
        if (req.method === 'GET') {
            return res.status(200).json({ success: true, message: 'paymob webhook endpoint is reachable' });
        }

        const body = req.body || {};
        const hmac = (req.query && req.query.hmac) || body.hmac;
        if (!hmac) {
            return res.status(400).json({ success: false, error: 'Missing hmac' });
        }

        const isValid = verifyPaymobHmac(hmac, body);
        if (!isValid) {
            return res.status(403).json({ success: false, error: 'Invalid HMAC' });
        }

        console.log('Done Paymob webhook verified:', JSON.stringify(body));

        const obj = body.obj || {};
        const paymobOrderId = obj.order && obj.order.id ? obj.order.id : undefined;
        const paymobTransactionId = obj.id;
        const success = obj.success === true || obj.success === 'true';

        if (paymobOrderId) {
            // حدّث الدفعه وارجع الدوكيومنت بعد التعديل
            const paymentDoc = await Payment.findOneAndUpdate(
                { paymobOrderId },
                {
                    status: success ? 'paid' : 'failed',
                    paymobTransactionId,
                    rawWebhookData: body,
                },
                { new: true }
            );

            // لو الدفعه اتأكدت (paid) امسح محتويات الكارت بتاع نفس اليوزر
            if (paymentDoc && success && paymentDoc.user) {
                const Cart = require('../models/cart');
                await Cart.findOneAndUpdate(
                    { user: paymentDoc.user },
                    {
                        $set: {
                            items: [],
                            totalQty: 0,
                            subtotal: 0,
                            discountTotal: 0,
                            totalCost: 0,
                        },
                    }
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

            