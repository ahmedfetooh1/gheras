const express = require("express");

const router = express.Router();
const upload = require("../Middlewares/upload");

const controller = require("../controllers/disease");

router.get("/", controller.getAllDiseases);

router.get("/:id", controller.getDiseaseById);

router.post("/", upload.single("image"), controller.createDisease);

router.put("/:id", upload.single("image"), controller.updateDisease);

router.delete("/:id", controller.deleteDisease);

module.exports = router;