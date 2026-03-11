const mongoose = require("mongoose");

const fertilizerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: String,
    image: String,

    composition: [{
    element: String,
    percentage: Number
    }],

    benefits: [String],
    applicationMethod: String,
    applicationRate: String,

    suitablePlants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plant"
    }]

}, { timestamps: true });

module.exports = mongoose.model("Fertilizer", fertilizerSchema);