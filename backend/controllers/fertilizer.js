const Fertilizer = require("../models/fertilizer");
const Plant = require("../models/plant");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// 1. Get All Fertilizers
exports.getAllFertilizers = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const fertilizers = await Fertilizer.find()
        .populate("suitablePlants", "commonName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Fertilizer.countDocuments();

    res.status(200).json({
        status: "success",
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: { fertilizers }
    });
});

// 2. Get Fertilizer By ID
exports.getFertilizerById = catchAsync(async (req, res, next) => {
    const fertilizer = await Fertilizer.findById(req.params.id)
        .populate("suitablePlants", "commonName images");

    if (!fertilizer) {
        return next(new AppError("No fertilizer found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        data: { fertilizer }
    });
});

// 3. Create Fertilizer (With Mutual Relationship Sync)
exports.createFertilizer = catchAsync(async (req, res, next) => {
    if (req.file) {
        req.body.image = "uploads/" + req.file.filename;
    }
    
    const savedFertilizer = await Fertilizer.create(req.body);

    // Bidirectional update: Add this Fertilizer to associated Plants
    if (savedFertilizer.suitablePlants && savedFertilizer.suitablePlants.length > 0) {
        await Plant.updateMany(
            { _id: { $in: savedFertilizer.suitablePlants } },
            { $addToSet: { fertilizers: savedFertilizer._id } }
        );
    }

    res.status(201).json({
        status: "success",
        data: { fertilizer: savedFertilizer }
    });
});

// 4. Update Fertilizer (With Relationship Sync)
exports.updateFertilizer = catchAsync(async (req, res, next) => {
    if (req.file) {
        req.body.image = "uploads/" + req.file.filename;
    }

    const oldFertilizer = await Fertilizer.findById(req.params.id);
    if (!oldFertilizer) {
        return next(new AppError("No fertilizer found with that ID", 404));
    }

    const updatedFertilizer = await Fertilizer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { 
            new: true, 
            runValidators: true 
        }
    );

    // Sync Bidirectional Relationships if suitablePlants updated
    if (req.body.suitablePlants) {
        await Plant.updateMany(
            { fertilizers: updatedFertilizer._id },
            { $pull: { fertilizers: updatedFertilizer._id } }
        );
        await Plant.updateMany(
            { _id: { $in: updatedFertilizer.suitablePlants } },
            { $addToSet: { fertilizers: updatedFertilizer._id } }
        );
    }

    res.status(200).json({
        status: "success",
        data: { fertilizer: updatedFertilizer }
    });
});

// 5. Delete Fertilizer (With Relationship Cleanup)
exports.deleteFertilizer = catchAsync(async (req, res, next) => {
    const deletedFertilizer = await Fertilizer.findByIdAndDelete(req.params.id);

    if (!deletedFertilizer) {
        return next(new AppError("No fertilizer found with that ID", 404));
    }

    // Bidirectional cleanup: Remove this Fertilizer from associated Plants
    await Plant.updateMany(
        { fertilizers: deletedFertilizer._id },
        { $pull: { fertilizers: deletedFertilizer._id } }
    );

    res.status(204).json({
        status: "success",
        data: null
    });
});