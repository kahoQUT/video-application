const { Router } = require("express");
const auth = require("../middleware/auth");
const { requestTranscode, getJob, downloadOutput } = require("../controllers/transcodeController");
const router = Router();

router.post("/transcode", auth, requestTranscode);
router.get("/job/:id", auth, getJob);
router.get("/download/:id", auth, downloadOutput); 
module.exports = router;
