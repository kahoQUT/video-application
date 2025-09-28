const { Router } = require("express");
const { authenticateCognito } = require("../middleware/cognitoAuth");
const storageController = require("../controllers/storageController");

const router = Router();

// Presign URL for S3 upload
router.post("/presign", authenticateCognito(), storageController.presignUpload);

// Register video metadata in DynamoDB after upload
router.post("/register-upload", authenticateCognito(), storageController.registerUpload);

// List user’s (or all, if admin) files
router.get("/", authenticateCognito(), storageController.listFiles);

module.exports = router;
