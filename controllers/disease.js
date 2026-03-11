const Disease = require("../models/disease");

exports.getAllDiseases = async (req, res) => {
    try {
    const diseases = await Disease.find().populate("affectedPlants");

    res.json(diseases);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};

exports.getDiseaseById = async (req, res) => {
    try {
    const disease = await Disease.findById(req.params.id)
        .populate("affectedPlants");

    res.json(disease);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};

exports.createDisease = async (req, res) => {
    try {
    const disease = new Disease(req.body);

    const saved = await disease.save();

    res.status(201).json(saved);
    } catch (error) {
    res.status(400).json({ message: error.message });
    }
};

exports.updateDisease = async (req, res) => {
    try {
    const disease = await Disease.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.json(disease);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};

exports.deleteDisease = async (req, res) => {
    try {
    await Disease.findByIdAndDelete(req.params.id);

    res.json({ message: "Disease deleted" });
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};