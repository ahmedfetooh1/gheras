const express = require("express");

const router = express.Router();
const upload = require("../Middlewares/upload");

const controller = require("../controllers/fertilizer");

router.get("/", controller.getAllFertilizers);

router.get("/:id", controller.getFertilizerById);

router.post("/", upload.single("image"), controller.createFertilizer);

router.put("/:id", upload.single("image"), controller.updateFertilizer);

router.delete("/:id", controller.deleteFertilizer);

module.exports = router;