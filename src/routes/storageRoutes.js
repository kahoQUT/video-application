const router = require("express").Router();
const { presignUpload, registerUpload } = require("../controllers/storageController");
const { authenticateCognito } = require("../middleware/cognitoAuth");

router.post("/", authenticateCognito(), presignUpload);
router.post("/upload", authenticateCognito(), registerUpload);

module.exports = router;
