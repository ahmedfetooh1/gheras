const Plant = require('../models/plant');
const Disease = require('../models/disease');
const Fertilizer = require('../models/fertilizer');

//يجب اضافة الامراض والأسمده اولا ثم اضافة النبته يا اما نضيف ملف جي سون فيه كل ده جاهز في الداتا بيز

exports.getAllPlants = async (req, res) => {
    try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    //لو إنت في صفحة 2 والـ limit هو 10، المعادلة هتكون: (2 - 1) * 15 = 15. يعني "فوت أول 15 وهات من رقم 11".
    const skip = (page - 1) * limit;

    const plants = await Plant.find()
        .select("commonName scientificName images")
        .populate("fertilizers", "name")
        .populate("diseases", "name")
        .skip(skip)
        .limit(limit);

    //ده بيجيب العدد الإجمالي عشان نحسب منه عدد الصفحات
    const total = await Plant.countDocuments();

    res.json({
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        data: plants
    });
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};

exports.getPlantById = async (req, res) => {
    try {
    const plant = await Plant.findById(req.params.id)
        .populate("fertilizers")
        .populate("diseases");

    if (!plant) {
        return res.status(404).json({ message: "Plant not found" });
    }

    res.json(plant);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};

exports.createPlant = async (req, res) => {
    try {
    if (req.files && req.files.length > 0) {
        req.body.images = req.files.map(file => "uploads/" + file.filename);
    }
    const plant = new Plant(req.body);
    const savedPlant = await plant.save();

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

    res.status(201).json(savedPlant);
    } catch (error) {
    res.status(400).json({ message: error.message });
    }
};

exports.updatePlant = async (req, res) => {
    try {
    if (req.files && req.files.length > 0) {
        req.body.images = req.files.map(file => "uploads/" + file.filename);
    }
    const plant = await Plant.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    if (!plant) {
        return res.status(404).json({ message: "Plant not found" });
    }

    res.json(plant);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};

exports.deletePlant = async (req, res) => {
    try {
    const deletedPlant = await Plant.findByIdAndDelete(req.params.id);

    if (!deletedPlant) {
        return res.status(404).json({ message: "Plant not found" });
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

    res.json({ message: "Plant deleted successfully" });
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};