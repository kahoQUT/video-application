const { Router } = require("express");
const { requestTranscode, getJob, downloadOutput } = require("../controllers/transcodeController");
const router = Router();
const { authenticateToken } = require("../../jwt");

router.post("/transcode", authenticateToken, requestTranscode);
router.get("/job/:id", authenticateToken, getJob);
router.get("/download/:id", authenticateToken, downloadOutput);
module.exports = router;
