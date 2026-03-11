const express = require("express");

const router = express.Router();

const controller = require("../controllers/disease");

router.get("/", controller.getAllDiseases);

router.get("/:id", controller.getDiseaseById);

router.post("/", controller.createDisease);

router.put("/:id", controller.updateDisease);

router.delete("/:id", controller.deleteDisease);

module.exports = router;