const User = require('../models/user');
const Payment = require('../models/payment');
const Plant = require('../models/plant');
const UserPlant = require('../models/userPlant');
const catchAsync = require('../utils/catchAsync'); 
const AppError = require('../utils/appError');   

// ──────────────────────────────────────────────
// POST /api/dashboard/add-plant
// ──────────────────────────────────────────────
exports.addPlantToDashboard = catchAsync(async (req, res, next) => {
    const { plantId } = req.body;
    const userId = req.user.id;

    // 1. التأكد من وجود النبتة في الكتالوج الرئيسي
    const plant = await Plant.findById(plantId).select(
        'commonName growthStages waterNeeds'
    );
    if (!plant) {
        return next(new AppError('Plant not found', 404));
    }

    // 2. التحقق من الحد الأقصى للنباتات (5 لليوزر العادي)
    const user = await User.findById(userId).select('role premium');
    if (user.role === 'user' && !user.premium) {
        const plantCount = await UserPlant.countDocuments({ user: userId });
        if (plantCount >= 5) {
            return next(new AppError(
                'Regular users can only add up to 5 plants. Upgrade to premium for unlimited access.',
                403
            ));
        }
    }

    // 3. التأكد إن النبتة مش مضافة مسبقاً للداشبورد
    const existingUserPlant = await UserPlant.findOne({ user: userId, plant: plantId });
    if (existingUserPlant) {
        return next(new AppError('This plant is already in your garden', 400));
    }

    const startDate = new Date();
    let daysCounter = 0;

    // 4. حساب مراحل النمو ديناميكياً (تحويل الأيام لتواريخ)
    const calculatedPlan = (plant.growthStages || []).map(stage => {
        const sDate = new Date(startDate);
        sDate.setDate(startDate.getDate() + daysCounter);

        daysCounter += stage.durationInDays;

        const eDate = new Date(startDate);
        eDate.setDate(startDate.getDate() + daysCounter);

        return {
            stageName: stage.name,
            startDate: sDate,
            endDate: eDate,
            isCompleted: false
        };
    });

    // 5. تحديد تاريخ انتهاء الحصاد لمنع الري اللانهائي
    const finalHarvestDate = calculatedPlan.length > 0
        ? calculatedPlan[calculatedPlan.length - 1].endDate
        : new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000); // 6 شهور افتراضي

    // 6. حساب جدول الري مع حماية من الـ Infinite Loop
    //    i = 0 عشان أول ري يكون يوم الإضافة نفسه (لتسهيل الاختبار على Postman)
    const schedule = [];
    const frequency = Number(plant.waterNeeds?.frequency);

    if (frequency && frequency > 0) {
        let safetyIteration = 0;
        for (let i = 0; safetyIteration < 500; i += frequency) {
            safetyIteration++;

            const nextDate = new Date(startDate);
            nextDate.setDate(startDate.getDate() + i);

            if (nextDate > finalHarvestDate) break;
            schedule.push(nextDate);
        }
    }

    // 7. إنشاء السجل الجديد في UserPlant
    const userPlant = await UserPlant.create({
        user: userId,
        plant: plantId,
        addedAt: startDate,
        wateringSchedule: schedule,
        calculatedGrowthPlan: calculatedPlan
    });

    res.status(201).json({
        status: 'success',
        message: 'Plant added to garden successfully with growth plan and watering schedule',
        data: userPlant
    });
});

// ──────────────────────────────────────────────
// GET /api/dashboard  →  Lightweight overview
// ──────────────────────────────────────────────
exports.getUserDashboard = catchAsync(async (req, res, next) => {
    // 1. بيانات المستخدم الأساسية
    const user = await User.findById(req.user.id)
        .select('firstName lastName email avatar premium');

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    // 2. الحديقة — خفيفة (commonName + images فقط)
    const gardenDocs = await UserPlant.find({ user: user._id })
        .select('plant addedAt')
        .populate('plant', 'commonName images');

    // Shape the myGarden array: only the required 4 fields
    const myGarden = gardenDocs.map(up => ({
        _id: up._id,
        plantName: up.plant?.commonName || 'Unknown',
        image: up.plant?.images?.[0] || null,
        addedAt: up.addedAt
    }));

    // 3. آخر 5 عمليات دفع ناجحة
    const recentPayments = await Payment.find({
        user: req.user.id,
        status: 'paid'
    }).sort({ createdAt: -1 }).limit(5).select('amountCents createdAt status');

    const totalSpentEGP = recentPayments.reduce(
        (sum, p) => sum + (p.amountCents / 100), 0
    );

    // 4. إشعارات الري (نباتات موعد ريها النهارده)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const wateringAlerts = await UserPlant.find({
        user: req.user.id,
        wateringSchedule: {
            $elemMatch: { $gte: startOfToday, $lte: endOfToday }
        }
    }).select('plant').populate('plant', 'commonName images');

    const notifications = wateringAlerts.map(item => ({
        userPlantId: item._id,
        plantName: item.plant?.commonName,
        image: item.plant?.images?.[0] || null,
        message: `حان وقت ري نبتة ${item.plant?.commonName} اليوم.`,
        type: 'watering_alert'
    }));

    // 5. الرد النهائي
    res.status(200).json({
        status: 'success',
        dashboardData: {
            profile: {
                fullName: `${user.firstName} ${user.lastName}`,
                email: user.email,
                avatar: user.avatar,
                isPremium: user.premium
            },
            stats: {
                totalPlants: myGarden.length,
                totalSpentEGP
            },
            myGarden,
            recentTransactions: recentPayments,
            notifications
        }
    });
});

// ──────────────────────────────────────────────
// GET /api/dashboard/my-plant/:id  →  Deep-Dive
// ──────────────────────────────────────────────
exports.getMyPlantDetails = catchAsync(async (req, res, next) => {
    const userPlant = await UserPlant.findOne({
        _id: req.params.id,
        user: req.user.id  // security: ensure it belongs to this user
    })
    .select('-__v')
    .populate({
        path: 'plant',
        select: 'commonName scientificName family description images growingSeason temperatureRange sunlightHours soilPH waterNeeds nutritionalValue growthStages potSizeOptions',
        populate: [
            {
                path: 'diseases',
                select: 'name scientificName image symptoms treatment prevention'
            },
            {
                path: 'fertilizers',
                select: 'name type image benefits applicationMethod applicationRate'
            }
        ]
    });

    if (!userPlant) {
        return next(new AppError('Plant record not found in your garden', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            userPlant: {
                _id: userPlant._id,
                addedAt: userPlant.addedAt,
                lastWateredDate: userPlant.lastWateredDate,
                calculatedGrowthPlan: userPlant.calculatedGrowthPlan,
                wateringSchedule: userPlant.wateringSchedule,
                plant: userPlant.plant
            }
        }
    });
});

// ──────────────────────────────────────────────
// DELETE /api/dashboard/my-plant/:id
// ──────────────────────────────────────────────
exports.removePlantFromDashboard = catchAsync(async (req, res, next) => {
    const deleted = await UserPlant.findOneAndDelete({
        _id: req.params.id,
        user: req.user.id  // security: user can only delete their own plants
    });

    if (!deleted) {
        return next(new AppError('Plant record not found in your garden', 404));
    }

    res.status(200).json({
        status: 'success',
        message: 'Plant removed from your garden successfully'
    });
});