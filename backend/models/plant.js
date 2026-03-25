const mongoose = require("mongoose");

const plantSchema = new mongoose.Schema({
    commonName: { type: String, required: true },
    scientificName: { type: String, required: true },
    family: String,
    description: String,
    images: [String],

    growingSeason: String,
    temperatureRange: {
    min: Number,
    max: Number
    },

    sunlightHours: Number,

    soilPH: {
    min: Number,
    max: Number
    },

    waterNeeds: {
    level: String,
    frequency: Number
    },

    nutritionalValue: String,

    fertilizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Fertilizer"
    }],

    diseases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Disease"
    }],

    potSizeOptions: [{
    plantType: String,
    min: Number,
    max: Number,
    unit: { type: String, default: "cm" }
    }],

    growthStages: [{
        name: { type: String, required: true },
        durationInDays: { type: Number, required: true },
        description: String
    }]

}, { timestamps: true });

module.exports = mongoose.model("Plant", plantSchema);