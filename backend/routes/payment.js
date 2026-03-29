const express = require('express');
const { createPayment, paymobWebhook, paymobApprove, paymobReturn } = require('../controllers/payment');
const { authentication } = require('../middlewares/authentication');

const router = express.Router();

router.post('/create-payment', authentication, createPayment);
router.post('/paymob/webhook', paymobWebhook);
router.get('/paymob/approve', paymobApprove);
router.get('/paymob/return', paymobReturn);

module.exports = router;