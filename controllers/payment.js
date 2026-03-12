
                const axios = require('axios');
const crypto = require('crypto');
const Payment = require('../models/payment');

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
        const { amount } = req.body; 
        const rawMethod = req.query.method || req.body.method || 'card';
        const method = String(rawMethod).toLowerCase().trim();

        let integrationId = PAYMOB_CARD_INTEGRATION_ID;
        let iframeId = PAYMOB_CARD_IFRAME_ID;

        if (method === 'wallet') {
            integrationId = PAYMOB_WALLET_INTEGRATION_ID;
            iframeId = PAYMOB_WALLET_IFRAME_ID;
        }

        const authToken = await getAuthToken();
        const orderId = await createOrder(authToken, amount);
        const paymentKey = await createPaymentKey(authToken, orderId, amount, integrationId);

        const paymentDoc = await Payment.create({
            user: req.userId || null,
            method,
            amountCents: amount * 100,
            currency: 'EGP',
            paymobOrderId: orderId,
            status: 'pending',
        });

        const iframeUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${paymentKey}`;

        res.status(200).json({ success: true, iframeUrl, paymentId: paymentDoc._id });
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
        const hmac = req.query.hmac || req.body.hmac;
        if (!hmac) {
            return res.status(400).json({ success: false, error: 'Missing hmac' });
        }

        const isValid = verifyPaymobHmac(hmac, req.body);
        if (!isValid) {
            return res.status(403).json({ success: false, error: 'Invalid HMAC' });
        }

        console.log('Done Paymob webhook verified:', JSON.stringify(req.body));

        const obj = req.body.obj || {};
        const paymobOrderId = obj.order && obj.order.id ? obj.order.id : undefined;
        const paymobTransactionId = obj.id;
        const success = obj.success === true || obj.success === 'true';

        if (paymobOrderId) {
            await Payment.findOneAndUpdate(
                { paymobOrderId },
                {
                    status: success ? 'paid' : 'failed',
                    paymobTransactionId,
                    rawWebhookData: req.body,
                }
            );
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error in Paymob webhook:', error.message);
        return res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { createPayment, paymobWebhook };

            