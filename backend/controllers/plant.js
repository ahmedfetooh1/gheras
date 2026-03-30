const Plant = require('../models/plant');
const Disease = require('../models/disease');
const Fertilizer = require('../models/fertilizer');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// 1. Get All Plants (With Pagination)
exports.getAllPlants = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const plants = await Plant.find()
        .select("commonName scientificName images family sunlightHours waterNeeds temperatureRange")
        .populate("fertilizers", "name")
        .populate("diseases", "name")
        .skip(skip)
        .limit(limit);

    const total = await Plant.countDocuments();

    res.status(200).json({
        status: "success",
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: { plants }
    });
});

// 2. Get Plant By ID
exports.getPlantById = catchAsync(async (req, res, next) => {
    const plant = await Plant.findById(req.params.id)
        .populate("fertilizers", "name image")
        .populate("diseases", "name image");

    if (!plant) {
        return next(new AppError("No plant found with that ID", 404));
    }

    res.status(200).json({
        status: "success",
        data: { plant }
    });
});

// 3. Create Plant (With Mutual Relationship Sync)
exports.createPlant = catchAsync(async (req, res, next) => {
    // Handle image uploads if they exist
    if (req.files && req.files.length > 0) {
        req.body.images = req.files.map(file => "uploads/" + file.filename);
    }

    const savedPlant = await Plant.create(req.body);

    // Bidirectional update: Add this Plant to associated Diseases
    if (savedPlant.diseases && savedPlant.diseases.length > 0) {
        await Disease.updateMany(
            { _id: { $in: savedPlant.diseases } },
            { $addToSet: { affectedPlants: savedPlant._id } }
        );
    }

    // Bidirectional update: Add this Plant to associated Fertilizers
    if (savedPlant.fertilizers && savedPlant.fertilizers.length > 0) {
        await Fertilizer.updateMany(
            { _id: { $in: savedPlant.fertilizers } },
            { $addToSet: { suitablePlants: savedPlant._id } }
        );
    }

    res.status(201).json({
        status: "success",
        data: { plant: savedPlant }
    });
});

// 4. Update Plant (With Relationship Sync)
exports.updatePlant = catchAsync(async (req, res, next) => {
    // Handle image uploads if they exist
    if (req.files && req.files.length > 0) {
        req.body.images = req.files.map(file => "uploads/" + file.filename);
    }

    const oldPlant = await Plant.findById(req.params.id);
    if (!oldPlant) {
        return next(new AppError("No plant found with that ID", 404));
    }

    const updatedPlant = await Plant.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
    );

    // Sync Bidirectional Relationships for Diseases if updated
    if (req.body.diseases) {
        // Remove plant from previous diseases' affectedPlants
        await Disease.updateMany(
            { affectedPlants: updatedPlant._id },
            { $pull: { affectedPlants: updatedPlant._id } }
        );
        // Add plant to new diseases' affectedPlants
        await Disease.updateMany(
            { _id: { $in: updatedPlant.diseases } },
            { $addToSet: { affectedPlants: updatedPlant._id } }
        );
    }

    // Sync Bidirectional Relationships for Fertilizers if updated
    if (req.body.fertilizers) {
        // Remove plant from previous fertilizers' suitablePlants
        await Fertilizer.updateMany(
            { suitablePlants: updatedPlant._id },
            { $pull: { suitablePlants: updatedPlant._id } }
        );
        // Add plant to new fertilizers' suitablePlants
        await Fertilizer.updateMany(
            { _id: { $in: updatedPlant.fertilizers } },
            { $addToSet: { suitablePlants: updatedPlant._id } }
        );
    }

    res.status(200).json({
        status: "success",
        data: { plant: updatedPlant }
    });
});

// 5. Delete Plant (With Relationship Cleanup)
exports.deletePlant = catchAsync(async (req, res, next) => {
    const deletedPlant = await Plant.findByIdAndDelete(req.params.id);

    if (!deletedPlant) {
        return next(new AppError("No plant found with that ID", 404));
    }

    // Bidirectional cleanup: Remove this Plant from associated Diseases
    await Disease.updateMany(
        { affectedPlants: deletedPlant._id },
        { $pull: { affectedPlants: deletedPlant._id } }
    );

    // Bidirectional cleanup: Remove this Plant from associated Fertilizers
    await Fertilizer.updateMany(
        { suitablePlants: deletedPlant._id },
        { $pull: { suitablePlants: deletedPlant._id } }
    );

    res.status(204).json({
        status: "success",
        data: null
    });
});