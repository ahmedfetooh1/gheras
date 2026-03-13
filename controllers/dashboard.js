// fatouh
const User = require('../models/user');
const Payment = require('../models/payment');
const Plant = require('../models/plant');

exports.getUserDashboard = async (req, res) => {
    // console.log(req.user);
    try {
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
            return res.status(404).json({ message: "User Not Found" });
        }

        const recentPayments = await Payment.find({ 
            user: req.user.id, 
            status: 'paid' 
        }).sort({ createdAt: -1 }).limit(5);

        const sickPlantsCount = userWithPlants.myPlants.filter(p => p.diseases.length > 0).length;

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
                    totalSpentEGP: recentPayments.reduce((sum, p) => sum + (p.amountCents / 100), 0)
                },
                myGarden: userWithPlants.myPlants, 
                recentTransactions: recentPayments 
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching dashboard data", error: error.message });
    }
};