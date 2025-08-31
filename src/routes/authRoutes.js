const { Router } = require("express");
const { login,me } = require("../controllers/authController");
const { authenticateToken } = require("../../jwt");
const router = Router();

router.post("/login", login);
router.get("/me", authenticateToken, me);
module.exports = router;
