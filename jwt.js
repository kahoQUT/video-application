const jwt = require("jsonwebtoken");

// Using a fixed authentication secret for demonstration purposes.
// Ideally this would be stored in a secrets manager and retrieved here.
// To create a new randomly chosen secret instead, you can use:
//
// tokenSecret = require("crypto").randomBytes(64).toString("hex");
//
const TOKEN_SECRET =
   "e9aae26be08551392be664d620fb422350a30349899fc254a0f37bfa1b945e36ff20d25b12025e1067f9b69e8b8f2ef0f767f6fff6279e5755668bf4bae88588";
const TOKEN_TTL = process.env.JWT_TTL || "12h";

function generateAccessToken({ id, username }) {
  if (!id || !username) throw new Error("generateAccessToken requires { id, username }");
  return jwt.sign({ sub: id, username }, TOKEN_SECRET, { expiresIn: TOKEN_TTL });
}

/**
 * Express middleware: verifies Bearer token and normalizes req.user.
 * - Accepts new tokens ({ sub, username })
 * - Accepts legacy string payloads ("admin") and normalizes to { username: "admin" }
 */
function authenticateToken(req, res, next) {
  const header = req.headers["authorization"] || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : null;

  if (!token) {
    console.log("JSON web token missing.");
    return res.sendStatus(401);
  }

  try {
    let payload = jwt.verify(token, TOKEN_SECRET);

    // Legacy support: if someone signed a raw string 'username'
    if (typeof payload === "string") payload = { username: payload };

    const id = payload.sub ?? payload.id ?? null;
    const username = payload.username ?? null;

	// Back-compat map if needed
    if (!id && username) {
      const m = USERS.find(u => u.username === username);
      if (m) id = m.id;
    }

    if (!id || !username) {
      return res.status(401).json({ error: "Token missing required claims. Please log in again." });
    }
    
    // Attach normalized user; controllers can use req.user.id (may be null for legacy tokens)
    req.user = { id, username };
    return next();
  } catch (err) {
    console.log(`JWT verification failed at URL ${req.url}`, err.name, err.message);
    return res.sendStatus(401);
  }
}

module.exports = { generateAccessToken, authenticateToken };
