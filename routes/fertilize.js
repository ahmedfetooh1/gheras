const express = require("express");

const router = express.Router();

const controller = require("../controllers/fertilizer");

router.get("/", controller.getAllFertilizers);

router.get("/:id", controller.getFertilizerById);

router.post("/", controller.createFertilizer);

router.put("/:id", controller.updateFertilizer);

router.delete("/:id", controller.deleteFertilizer);

module.exports = router;