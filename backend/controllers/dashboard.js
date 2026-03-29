const mongoose = require('mongoose');
const User = require('../models/user');
const Payment = require('../models/payment');
const Plant = require('../models/plant');
const UserPlant = require('../models/userPlant');
const catchAsync = require('../utils/catchAsync'); 
const AppError = require('../utils/appError');

// ──────────────────────────────────────────────
// POST /api/dashboard/add-plant (With Transactions)
// ──────────────────────────────────────────────
exports.addPlantToDashboard = catchAsync(async (req, res, next) => {
    const { plantId } = req.body;
    const userId = req.user.id;

    // نبدأ الجلسة (Session) للـ Transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. التأكد من وجود النبتة
        const plant = await Plant.findById(plantId).session(session);
        if (!plant) {
            throw new AppError('Plant not found', 404);
        }

        // 2. التحقق من الحد الأقصى للنباتات
        const user = await User.findById(userId).session(session);
        if (user.role === 'user' && !user.premium) {
            const plantCount = await UserPlant.countDocuments({ user: userId }).session(session);
            if (plantCount >= 5) {
                throw new AppError('Regular users limit reached (5 plants). Upgrade to premium.', 403);
            }
        }

        // 3. منع التكرار
        const existing = await UserPlant.findOne({ user: userId, plant: plantId }).session(session);
        if (existing) {
            throw new AppError('This plant is already in your garden', 400);
        }

        // --- Logic الحسابات (نفسه كما هو) ---
        const startDate = new Date();
        let daysCounter = 0;
        const calculatedPlan = (plant.growthStages || []).map(stage => {
            const sDate = new Date(startDate);
            sDate.setDate(startDate.getDate() + daysCounter);
            daysCounter += stage.durationInDays;
            const eDate = new Date(startDate);
            eDate.setDate(startDate.getDate() + daysCounter);
            return { stageName: stage.name, startDate: sDate, endDate: eDate, isCompleted: false };
        });

        const finalHarvestDate = calculatedPlan.length > 0 
            ? calculatedPlan[calculatedPlan.length - 1].endDate 
            : new Date(startDate.getTime() + 180 * 24 * 60 * 60 * 1000);

        const schedule = [];
        const frequency = Number(plant.waterNeeds?.frequency);
        if (frequency > 0) {
            for (let i = 0; i < 500; i += frequency) {
                const nextDate = new Date(startDate);
                nextDate.setDate(startDate.getDate() + i);
                if (nextDate > finalHarvestDate) break;
                schedule.push(nextDate);
            }
        }

        // 4. إنشاء السجل داخل الـ Transaction
        const userPlant = await UserPlant.create([{
            user: userId,
            plant: plantId,
            addedAt: startDate,
            lastWateredDate: startDate,
            nextWateringDate: schedule.length > 0 ? schedule[0] : null,
            wateringSchedule: schedule,
            calculatedGrowthPlan: calculatedPlan
        }], { session });

        // إتمام العملية بنجاح
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ status: 'success', data: userPlant[0] });

    } catch (error) {
        // في حالة حدوث أي خطأ، نلغي كل العمليات اللي تمت
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
});

// ──────────────────────────────────────────────
// GET /api/dashboard (With Pagination)
// ──────────────────────────────────────────────
exports.getUserDashboard = catchAsync(async (req, res, next) => {
    // 1. إعدادات الـ Pagination للحديقة
    const page = parseInt(req.query.page) * 1 || 1;
    const limit = parseInt(req.query.limit) * 1 || 6; // افتراضياً 6 نباتات في الصفحة
    const skip = (page - 1) * limit;

    // 2. جلب بيانات اليوزر والحديقة (بالتوازي لتحسين الأداء)
    const [user, gardenDocs, totalPlantsCount] = await Promise.all([
        User.findById(req.user.id).select('firstName lastName email avatar premium'),
        UserPlant.find({ user: req.user.id })
            .select('plant addedAt wateringSchedule') // جلبنا جدول الري عشان الـ Virtual يشتغل
            .populate('plant', 'commonName images')
            .skip(skip)
            .limit(limit)
            .sort({ addedAt: -1 }),
        UserPlant.countDocuments({ user: req.user.id })
    ]);

    if (!user) return next(new AppError('User not found', 404));

    // 3. تشكيل بيانات الحديقة (نستخدم الـ Virtual هنا)
    const myGarden = gardenDocs.map(up => ({
        _id: up._id,
        plantName: up.plant?.commonName || 'Unknown',
        image: up.plant?.images?.[0] || null,
        addedAt: up.addedAt,
        nextWatering: up.nextWateringDate // تم تغييرها لتقرأ من الحقل مباشرة
    }));

    // 4. التنبيهات (استعلام لري اليوم وبكرة)
    const today = new Date();
    const tomorrowEndOfDay = new Date();
    tomorrowEndOfDay.setDate(today.getDate() + 1);
    tomorrowEndOfDay.setHours(23, 59, 59, 999);

    const wateringAlerts = await UserPlant.find({
        user: req.user.id,
        nextWateringDate: { $lte: tomorrowEndOfDay }
    }).populate('plant', 'commonName');

    const notifications = wateringAlerts.map(item => {
        const nextDate = new Date(item.nextWateringDate);
        const isTomorrow = nextDate.getDate() !== today.getDate() && nextDate > today;
        return {
            plantName: item.plant?.commonName,
            message: isTomorrow 
                ? `نبتة ${item.plant?.commonName} تحتاج ري غداً.` 
                : `نبتة ${item.plant?.commonName} تحتاج للري اليوم أو متأخرة!`,
            type: 'watering_alert',
            isTomorrow: isTomorrow
        };
    });

    res.status(200).json({
        status: 'success',
        results: myGarden.length,
        totalPlants: totalPlantsCount, // مفيد للـ Frontend عشان يعمل Pagination UI
        currentPage: page,
        dashboardData: {
            profile: {
                fullName: `${user.firstName} ${user.lastName}`,
                isPremium: user.premium,
                avatar: user.avatar
            },
            myGarden,
            notifications
        }
    });
});

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

                nextWateringDate: userPlant.nextWateringDate,

                plant: userPlant.plant

            }

        }

    });

});






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

exports.waterPlant = catchAsync(async (req, res, next) => {
    // جلب النبتة والتأكد من أنها تعود للمستخدم
    const userPlant = await UserPlant.findOne({
        _id: req.params.id,
        user: req.user.id
    }).populate('plant', 'waterNeeds');

    if (!userPlant || !userPlant.plant) {
        return next(new AppError('Plant record not found in your garden', 404));
    }

    // حساب التواريخ الجديدة
    const now = new Date();
    const frequency = Number(userPlant.plant.waterNeeds?.frequency) || 0;
    
    let nextDate = null;
    if (frequency > 0) {
        nextDate = new Date(now);
        nextDate.setDate(now.getDate() + frequency);
    }

    // تحديث قاعدة البيانات
    userPlant.lastWateredDate = now;
    userPlant.nextWateringDate = nextDate;
    await userPlant.save();

    res.status(200).json({
        status: 'success',
        message: 'تم سقاية النبتة بنجاح، وتحديث موعد الري القادم.',
        data: {
            lastWateredDate: userPlant.lastWateredDate,
            nextWateringDate: userPlant.nextWateringDate
        }
    });
});