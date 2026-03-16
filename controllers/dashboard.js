const User = require('../models/user');
const Payment = require('../models/payment');
const Plant = require('../models/plant');
const catchAsync = require('../utils/catchAsync'); 
const AppError = require('../utils/appError');   

exports.getUserDashboard = catchAsync(async (req, res, next) => {
    const userWithPlants = await User.findById(req.user.id)
        .select('firstName lastName email avatar premium myPlants')
        .populate({
            path: 'myPlants',
            populate: {
                path: 'diseases',
                select: 'name treatment image'
            }
        });

    if (!userWithPlants) {
        return next(new AppError('This user is not found', 404));
    }

    // history of payment
    const recentPayments = await Payment.find({ 
        user: req.user.id, 
        status: 'paid' 
    }).sort({ createdAt: -1 }).limit(5);

    // calc sick plants and total spent
    const sickPlantsCount = userWithPlants.myPlants.filter(p => p.diseases.length > 0).length;
    const totalSpentEGP = recentPayments.reduce((sum, p) => sum + (p.amountCents / 100), 0);

    res.status(200).json({
        success: true,
        dashboardData: {
            profile: {
                fullName: `${userWithPlants.firstName} ${userWithPlants.lastName}`,
                avatar: userWithPlants.avatar,
                isPremium: userWithPlants.premium
            },
            stats: {
                totalPlants: userWithPlants.myPlants.length,
                sickPlants: sickPlantsCount,
                totalSpentEGP: totalSpentEGP
            },
            myGarden: userWithPlants.myPlants,
            recentTransactions: recentPayments
        }
    });
});