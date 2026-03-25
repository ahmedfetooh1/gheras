const express = require("express");

const router = express.Router();
const upload = require("../middlewares/upload");

const plantController = require("../controllers/plant");

const { authentication, authorization } = require("../middlewares/authentication");

router.get("/", plantController.getAllPlants);
router.get("/:id", plantController.getPlantById);

router.post("/", authentication, authorization("admin"), upload.array("images", 5), plantController.createPlant);
router.put("/:id", authentication, authorization("admin"), upload.array("images", 5), plantController.updatePlant);
router.delete("/:id", authentication, authorization("admin"), plantController.deletePlant);

module.exports = router;