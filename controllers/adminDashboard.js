const User = require('../models/user');
const Payment = require('../models/payment');
const Plant = require('../models/plant');
const Product = require('../models/product');
const Disease = require('../models/disease');
const Fertilizer = require('../models/fertilizer');
const Category = require('../models/category');
const Blog = require('../models/blogsModel');
const catchAsync = require('../utils/catchAsync'); 

exports.getAdminDashboard = catchAsync(async (req, res, next) => {
    // 1. User stats
    const totalUsers = await User.countDocuments({ role: 'user' });
    const premiumUsers = await User.countDocuments({ role: 'user', premium: true });
    
    // 2. Financial stats (Sales from Paid Payments/Orders)
    const successfulPayments = await Payment.find({ status: 'paid' });
    const totalRevenueCents = successfulPayments.reduce((acc, pay) => acc + (pay.amountCents || 0), 0);
    const totalRevenueEGP = totalRevenueCents / 100;
    
    // 3. System Entities Counts
    const totalProducts = await Product.countDocuments();
    const totalPlants = await Plant.countDocuments();
    const totalDiseases = await Disease.countDocuments();
    const totalFertilizers = await Fertilizer.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalBlogs = await Blog.countDocuments();

    res.status(200).json({
        success: true,
        stats: {
            users: {
                total: totalUsers,
                premium: premiumUsers,
                regular: totalUsers - premiumUsers
            },
            financials: {
                totalRevenueEGP: totalRevenueEGP,
                totalSuccessfulPayments: successfulPayments.length
            },
            catalog: {
                products: totalProducts,
                plants: totalPlants,
                diseases: totalDiseases,
                fertilizers: totalFertilizers,
                categories: totalCategories,
                blogs: totalBlogs
            }
        }
    });
});
