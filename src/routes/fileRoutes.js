const { Router } = require("express");
const auth = require("../middleware/auth");
const { upload, listFiles, download } = require("../controllers/fileController");
const router = Router();

router.post("/upload", auth, upload);
router.get("/files", auth, listFiles);
router.get("/download/:id", auth, download); // originals only; outputs in transcodeRoutes
module.exports = router;
