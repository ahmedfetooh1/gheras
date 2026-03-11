const express = require('express');
const { createPayment, paymobWebhook } = require('../controllers/paymet');
const { authentication } = require('../Middlewares/authentication');

const router = express.Router();

router.post('/create-payment', authentication, createPayment);
router.post('/paymob/webhook', paymobWebhook);

module.exports = router;