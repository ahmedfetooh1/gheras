const User = require('../models/user');
const Payment = require('../models/payment');
const Plant = require('../models/plant');
const Product = require('../models/product');
const Disease = require('../models/disease');
const Fertilizer = require('../models/fertilizer');
const Category = require('../models/category');
const Blog = require('../models/blogsModel');
const Post = require('../models/post');
const Comment = require('../models/comment');
const Order = require('../models/order');
const SucceededOrder = require('../models/succeededOrder');
const catchAsync = require('../utils/catchAsync'); 

exports.getAdminDashboard = catchAsync(async (req, res, next) => {
    // 1. User stats (counting anyone who isn't explicitly an admin to catch legacy users)
    const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });
    const premiumUsers = await User.countDocuments({ role: { $ne: 'admin' }, premium: true });
    
    // 2. Financial stats (Sales from Paid Payments/Orders)
    const successfulPayments = await Payment.find({ status: 'paid' });
    const totalRevenueCents = successfulPayments.reduce((acc, pay) => acc + (pay.amountCents || 0), 0);
    const totalOnlineRevenueEGP = totalRevenueCents / 100;

    const cashOrders = await Order.find({ paymentMethod: 'cash', status: 'delivered' });
    const totalCashRevenueEGP = cashOrders.reduce((acc, order) => acc + (order.total || 0), 0);
    
    const totalRevenueEGP = totalOnlineRevenueEGP + totalCashRevenueEGP;

    // Calculate True Net Profit: sum of (Selling Price - Cost Price) * Quantity for all delivered orders
    const deliveredOrdersList = await Order.find({ status: 'delivered' }).populate('items.product');
    let trueNetProfit = 0;

    deliveredOrdersList.forEach(order => {
        order.items.forEach(item => {
            if (item.product) {
                // Use finalPrice if available, otherwise fallback to price
                const sellingPrice = item.finalPrice !== undefined ? item.finalPrice : (item.price || 0);
                const costPrice = item.product.costPrice || 0;
                const quantity = item.quantity || 1;
                trueNetProfit += (sellingPrice - costPrice) * quantity;
            }
        });
    });

    
    // 3. System Entities Counts
    const totalProducts = await Product.countDocuments();
    const totalPlants = await Plant.countDocuments();
    const totalDiseases = await Disease.countDocuments();
    const totalFertilizers = await Fertilizer.countDocuments();
    const totalCategories = await Category.countDocuments();
    const totalBlogs = await Blog.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();
    
    // 4. Order Stats
    const totalPendingOrders = await Order.countDocuments({ status: 'pending' });
    const totalDeliveredOrders = await SucceededOrder.countDocuments();

    // 5. Total Sold Products
    const soldProductsAggregation = await Order.aggregate([
        { $match: { status: 'delivered' } },
        { $unwind: '$items' },
        { $group: { _id: null, totalSold: { $sum: '$items.quantity' } } }
    ]);
    const totalSoldProducts = soldProductsAggregation.length > 0 ? soldProductsAggregation[0].totalSold : 0;

    res.status(200).json({
        success: true,
        stats: {
            users: {
                total: totalUsers,
                premium: premiumUsers,
                regular: totalUsers - premiumUsers
            },
            financials: {
                netProfit: trueNetProfit,
                totalRevenueEGP: totalRevenueEGP,
                totalSuccessfulPayments: successfulPayments.length
            },
            catalog: {
                products: totalProducts,
                plants: totalPlants,
                diseases: totalDiseases,
                fertilizers: totalFertilizers,
                categories: totalCategories,
                blogs: totalBlogs,
            },
            community: {
                posts: totalPosts,
                comments: totalComments
            },
            sales: {
                soldProducts: totalSoldProducts,
                deliveredOrders: totalDeliveredOrders,
                pendingOrders: totalPendingOrders
            }
        }
    });
});

