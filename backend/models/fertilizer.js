const mongoose = require("mongoose");

const fertilizerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    image: String,

    composition: [{
    element: { type: String, required: true },
    percentage: { type: Number, required: true }
    }],

    benefits: [{ type: String, required: true }],
    applicationMethod: String,
    applicationRate: String,

    suitablePlants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plant"
    }]

}, { timestamps: true });

module.exports = mongoose.model("Fertilizer", fertilizerSchema);