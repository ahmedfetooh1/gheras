const express = require('express');
const { createPayment, paymobWebhook } = require('../controllers/payment');
const { authentication } = require('../middlewares/authentication');

const router = express.Router();

router.post('/create-payment', authentication, createPayment);
router.post('/paymob/webhook', paymobWebhook);

module.exports = router;