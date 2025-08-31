const { Router } = require("express");
const { upload, listFiles, download } = require("../controllers/fileController");
const router = Router();
const { authenticateToken } = require("../../jwt");

router.post("/upload", authenticateToken, upload);
router.get("/files", authenticateToken, listFiles);
router.get("/download/:id", authenticateToken, (req, res, next) => {
  const type = String(req.query.type || "original").toLowerCase();
  if (type !== "original") return next();   // -> handled by transcodeRoutes
  return download(req, res, next);
});
module.exports = router;
