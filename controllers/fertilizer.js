const Fertilizer = require("../models/fertilizer");

exports.getAllFertilizers = async (req, res) => {
    try {
    const fertilizers = await Fertilizer.find().populate("suitablePlants");

    res.json(fertilizers);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};

exports.getFertilizerById = async (req, res) => {
    try {
    const fertilizer = await Fertilizer.findById(req.params.id)
        .populate("suitablePlants");

    res.json(fertilizer);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};

exports.createFertilizer = async (req, res) => {
    try {
    const fertilizer = new Fertilizer(req.body);

    const saved = await fertilizer.save();

    res.status(201).json(saved);
    } catch (error) {
    res.status(400).json({ message: error.message });
    }
};

exports.updateFertilizer = async (req, res) => {
    try {
    const fertilizer = await Fertilizer.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.json(fertilizer);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};

exports.deleteFertilizer = async (req, res) => {
    try {
    await Fertilizer.findByIdAndDelete(req.params.id);

    res.json({ message: "Fertilizer deleted" });
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};