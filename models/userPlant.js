const mongoose = require("mongoose");

const userPlantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    plant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plant",
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    },
    lastWateredDate: {
        type: Date,
        default: Date.now
    },
    nextWateringDate: {
        type: Date
    },

    // Array of calculated watering dates (pre-computed on add)
    wateringSchedule: [Date],

    // Calculated growth plan (derived from Plant.growthStages on add)
    calculatedGrowthPlan: [{
        stageName: String,
        startDate: Date,
        endDate: Date,
        isCompleted: { type: Boolean, default: false }
    }]
}, { timestamps: true });

module.exports = mongoose.model("UserPlant", userPlantSchema);
