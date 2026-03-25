const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');
const { authentication } = require('../middlewares/authentication');

// GET  /api/dashboard          → Lightweight overview (garden list + notifications)
router.get('/', authentication, dashboardController.getUserDashboard);

// POST /api/dashboard/add-plant → Add a plant to user's garden
router.post('/add-plant', authentication, dashboardController.addPlantToDashboard);

// GET  /api/dashboard/my-plant/:id → Deep-dive: full plant details + growth + watering schedule
router.get('/my-plant/:id', authentication, dashboardController.getMyPlantDetails);

// DELETE /api/dashboard/my-plant/:id → Remove a plant from user's garden
router.delete('/my-plant/:id', authentication, dashboardController.removePlantFromDashboard);


module.exports = router;