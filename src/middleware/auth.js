const jwt = require("jsonwebtoken");
const { USERS } = require("../controllers/authController");
const JWT_SECRET = "e9aae26be08551392be664d620fb422350a30349899fc254a0f37bfa1b945e36ff20d25b12025e1067f9b69e8b8f2ef0f767f6fff6279e5755668bf4bae88588";

function auth(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Bearer token" });
  try {
 	const payload = jwt.verify(token, JWT_SECRET);
	// Normalize to { id, username }
    let id = payload.sub ?? null;
    let username = payload.username ?? null;

    // Back-compat: if no sub, map username -> id from USERS list
    if (!id && username) {
      const match = USERS.find(u => u.username === username);
      if (match) id = match.id;
    }

    if (!id || !username) {
      console.error("JWT ok but missing id/username:", payload);
      return res.status(401).json({ error: "Token missing required claims" });
    }

    req.user = { id, username, claims: payload };

    	console.log(
         `authToken verified for user: ${user.username} at URL ${req.url}`
  	);
	next();
  } catch (e) {
	console.log(
         `JWT verification failed at URL ${req.url}`,
         e.name,
         e.message
      );
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
module.exports = auth;
