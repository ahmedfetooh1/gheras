const express = require("express");

const router = express.Router();
const upload = require("../middlewares/upload");

const controller = require("../controllers/disease");

const { authentication, authorization } = require("../middlewares/authentication");

router.get("/", controller.getAllDiseases);
router.get("/:id", controller.getDiseaseById);

router.post("/", authentication, authorization("admin"), upload.single("image"), controller.createDisease);
router.put("/:id", authentication, authorization("admin"), upload.single("image"), controller.updateDisease);
router.delete("/:id", authentication, authorization("admin"), controller.deleteDisease);

module.exports = router;