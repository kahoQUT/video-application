const jwt = require("jsonwebtoken");

const JWT_SECRET = "e9aae26be08551392be664d620fb422350a30349899fc254a0f37bfa1b945e36ff20d25b12025e1067f9b69e8b8f2ef0f767f6fff6279e5755668bf4bae88588";

function auth(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing Bearer token" });
  try {
  	req.user = jwt.verify(token, JWT_SECRET);
    	console.log(
         `authToken verified for user: ${user.username} at URL ${req.url}`
  	);
	next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
module.exports = auth;
