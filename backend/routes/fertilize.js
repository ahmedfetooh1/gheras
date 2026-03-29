const express = require("express");

const router = express.Router();
const upload = require("../middlewares/upload");

const controller = require("../controllers/fertilizer");

const { authentication, authorization } = require("../middlewares/authentication");

router.get("/", controller.getAllFertilizers);
router.get("/:id", controller.getFertilizerById);

router.post("/", authentication, authorization("admin"), upload.single("image"), controller.createFertilizer);
router.put("/:id", authentication, authorization("admin"), upload.single("image"), controller.updateFertilizer);
router.delete("/:id", authentication, authorization("admin"), controller.deleteFertilizer);

module.exports = router;