const Plant = require('../models/plant');

exports.getAllPlants = async (req, res) => {
    try {
    const plants = await Plant.find()
        .populate("fertilizers")
        .populate("diseases");

    res.json(plants);
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
    const plant = new Plant(req.body);

    const savedPlant = await plant.save();

    res.status(201).json(savedPlant);
    } catch (error) {
    res.status(400).json({ message: error.message });
    }
};

exports.updatePlant = async (req, res) => {
    try {
    const plant = await Plant.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    );

    res.json(plant);
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};

exports.deletePlant = async (req, res) => {
    try {
    await Plant.findByIdAndDelete(req.params.id);

    res.json({ message: "Plant deleted successfully" });
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};