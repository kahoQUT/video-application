const { Router } = require("express");
const { authenticateCognito } = require("../middleware/cognitoAuth");
const transcodeController = require("../controllers/transcodeController");

const router = Router();
// Start a new transcode job
router.post("/transcode", authenticateCognito(), transcodeController.startTranscode);

// Check job status
router.get("/job/:id", authenticateCognito(), transcodeController.getJob);

// Download via presigned URL (original or output)
router.get("/download/:id", authenticateCognito(), transcodeController.download);

module.exports = router;
