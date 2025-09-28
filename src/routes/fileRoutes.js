const { Router } = require("express");
const { authenticateCognito } = require("../middleware/cognitoAuth");
const storageController = require("../controllers/storageController");

const router = Router();

// List user’s (or all, if admin) files
router.get("/", authenticateCognito(), storageController.listFiles);

module.exports = router;
