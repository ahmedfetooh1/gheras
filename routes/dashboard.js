// fatouh
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');
const { authentication } = require('../Middlewares/authentication'); //



router.get('/', authentication, dashboardController.getUserDashboard);


module.exports = router;