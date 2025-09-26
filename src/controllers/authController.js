// src/controllers/authController.js
function me(req, res) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  res.json({
    sub: req.user.sub,
    username: req.user.username,
    role: req.user.role,
    groups: req.user.claims["cognito:groups"] || [],
    email: req.user.claims.email,
    expiresAt: req.user.claims.exp ? new Date(req.user.claims.exp * 1000).toISOString() : null
  });
}

module.exports = { me };
