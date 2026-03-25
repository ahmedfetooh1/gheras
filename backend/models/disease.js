const mongoose = require("mongoose");

const diseaseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    scientificName: String,
    image: String,

    pathogenType: String,

    symptoms: [String],
    favorableConditions: String,
    prevention: [String],
    treatment: [String],

    affectedPlants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plant"
    }]

}, { timestamps: true });

module.exports = mongoose.model("Disease", diseaseSchema);