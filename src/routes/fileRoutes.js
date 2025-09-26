const { Router } = require("express");
const { authenticateCognito } = require("../middleware/cognitoAuth");
const { upload, listFiles, download } = require("../controllers/fileController");

const router = Router();
router.post("/upload", authenticateCognito(), upload);
router.get ("/files",  authenticateCognito(), listFiles);
router.get ("/download/:id", authenticateCognito(), (req,res,next)=>{
  const type = String(req.query.type || "original").toLowerCase();
  if (type !== "original") return next();
  return download(req,res,next);
});
module.exports = router;
