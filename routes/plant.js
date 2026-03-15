const express = require("express");

const router = express.Router();
const upload = require("../Middlewares/upload");

const plantController = require("../controllers/plant");

router.get("/", plantController.getAllPlants);

router.get("/:id", plantController.getPlantById);

router.post("/", upload.array("images", 5), plantController.createPlant);

router.put("/:id", upload.array("images", 5), plantController.updatePlant);

router.delete("/:id", plantController.deletePlant);

module.exports = router;