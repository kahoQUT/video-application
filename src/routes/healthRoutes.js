const { Router } = require("express");
const { healthz } = require("../controllers/healthController");
const router = Router();

router.get("/healthz", healthz);
module.exports = router;
