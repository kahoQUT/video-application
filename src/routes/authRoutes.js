// src/routes/authRoutes.js
const { Router } = require("express");
const { me } = require("../controllers/authController");
const { authenticateCognito } = require("../middleware/cognitoAuth");

const router = Router();
router.get("/me", authenticateCognito(), me);

module.exports = router;
