const Disease = require("../models/disease");
const Plant = require("../models/plant");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

// 1. Get All Diseases
exports.getAllDiseases = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const diseases = await Disease.find()
        .populate("affectedPlants", "commonName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const total = await Disease.countDocuments();

    res.status(200).json({
        status: "success",
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: { diseases }
    });
});

// 2. Get Disease By ID
exports.getDiseaseById = catchAsync(async (req, res, next) => {
    const disease = await Disease.findById(req.params.id)
        .populate("affectedPlants", "commonName images");

    if (!disease) {
        return next(new AppError("No disease found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        data: { disease }
    });
});

// 3. Create Disease (With Mutual Relationship Sync)
exports.createDisease = catchAsync(async (req, res, next) => {
    if (req.file) {
        req.body.image = "uploads/" + req.file.filename;
    }

    const savedDisease = await Disease.create(req.body);

    // Bidirectional update: Add this Disease to associated Plants
    if (savedDisease.affectedPlants && savedDisease.affectedPlants.length > 0) {
        await Plant.updateMany(
            { _id: { $in: savedDisease.affectedPlants } },
            { $addToSet: { diseases: savedDisease._id } }
        );
    }

    res.status(201).json({
        status: "success",
        data: { disease: savedDisease }
    });
});

// 4. Update Disease (With Relationship Sync)
exports.updateDisease = catchAsync(async (req, res, next) => {
    if (req.file) {
        req.body.image = "uploads/" + req.file.filename;
    }

    const oldDisease = await Disease.findById(req.params.id);
    if (!oldDisease) {
        return next(new AppError("No disease found with that ID", 404));
    }

    const updatedDisease = await Disease.findByIdAndUpdate(
        req.params.id, 
        req.body, 
        {
            new: true,
            runValidators: true 
        }
    );

    // Sync Bidirectional Relationships if affectedPlants updated
    if (req.body.affectedPlants) {
        await Plant.updateMany(
            { diseases: updatedDisease._id },
            { $pull: { diseases: updatedDisease._id } }
        );
        await Plant.updateMany(
            { _id: { $in: updatedDisease.affectedPlants } },
            { $addToSet: { diseases: updatedDisease._id } }
        );
    }

    res.status(200).json({
        status: "success",
        data: { disease: updatedDisease }
    });
});

// 5. Delete Disease (With Relationship Cleanup)
exports.deleteDisease = catchAsync(async (req, res, next) => {
    const deletedDisease = await Disease.findByIdAndDelete(req.params.id);

    if (!deletedDisease) {
        return next(new AppError("No disease found with that ID", 404));
    }

    // Bidirectional cleanup: Remove this Disease from associated Plants
    await Plant.updateMany(
        { diseases: deletedDisease._id },
        { $pull: { diseases: deletedDisease._id } }
    );

    res.status(204).json({
        status: "success",
        data: null
    });
});