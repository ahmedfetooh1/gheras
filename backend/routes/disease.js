const express = require("express");

const router = express.Router();
const upload = require("../middlewares/upload");
const parseJsonFields = require("../Middlewares/parseJsonFields");

const controller = require("../controllers/disease");

const { authentication, authorization } = require("../middlewares/authentication");

router.get("/", controller.getAllDiseases);
router.get("/:id", controller.getDiseaseById);

router.post("/", authentication, authorization("admin"), upload.single("image"), parseJsonFields, controller.createDisease);
router.put("/:id", authentication, authorization("admin"), upload.single("image"), parseJsonFields, controller.updateDisease);
router.delete("/:id", authentication, authorization("admin"), controller.deleteDisease);

module.exports = router;