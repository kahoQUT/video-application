const { Router } = require("express");
const auth = require("../middleware/auth");
const { upload, listFiles, download } = require("../controllers/fileController");
const router = Router();
const { authenticateToken } = require("../../jwt");

router.post("/upload", authenticateToken, upload);
router.get("/files", authenticateToken, listFiles);
router.get("/download/:id", authenticateToken, download); // originals only; outputs in transcodeRoutes
module.exports = router;
