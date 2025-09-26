const { Router } = require("express");
const { authenticateCognito } = require("../middleware/cognitoAuth");
const { requestTranscode, getJob, downloadOutput } = require("../controllers/transcodeController");

const router = Router();
router.post("/transcode", authenticateCognito(), requestTranscode);
router.get ("/job/:id",   authenticateCognito(), getJob);
router.get ("/download/:id", authenticateCognito(), downloadOutput);
module.exports = router;
