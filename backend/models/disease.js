const mongoose = require("mongoose");

const diseaseSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    scientificName: { type: String, trim: true },
    image: String,

    pathogenType: { type: String, required: true, trim: true },

    symptoms: [{ type: String, required: true }],
    favorableConditions: String,
    prevention: [{ type: String, required: true }],
    treatment: [String],

    affectedPlants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plant"
    }]

}, { timestamps: true });

module.exports = mongoose.model("Disease", diseaseSchema);