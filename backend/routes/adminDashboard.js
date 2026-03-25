const express = require('express');
const router = express.Router();
const adminDashboardController = require('../controllers/adminDashboard');
const { authentication, authorization } = require('../middlewares/authentication'); 

router.use(authentication);
router.use(authorization('admin')); // Only admins can access these routes

router.get('/', adminDashboardController.getAdminDashboard);

module.exports = router;
