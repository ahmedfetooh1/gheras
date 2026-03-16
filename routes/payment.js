const express = require('express');
const { createPayment, paymobWebhook } = require('../controllers/payment');
const { authentication } = require('../middlewares/authentication');

const router = express.Router();

router.post('/create-payment', authentication, createPayment);
// Paymob may call webhook using POST; allow GET for manual testing
router.all('/paymob/webhook', paymobWebhook);

module.exports = router;