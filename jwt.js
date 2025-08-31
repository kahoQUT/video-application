const jwt = require("jsonwebtoken");
const TOKEN_SECRET =
   "e9aae26be08551392be664d620fb422350a30349899fc254a0f37bfa1b945e36ff20d25b12025e1067f9b69e8b8f2ef0f767f6fff6279e5755668bf4bae88588";
const TOKEN_TTL = process.env.JWT_TTL || "12h";

const USER_MAP = {
  admin: { id: 1, role: "admin" },
  bob:   { id: 2, role: "user" },
};

function generateAccessToken({ id, username, role }) {
  if (!id || !username || !role) throw new Error("generateAccessToken requires { id, username, role }");
  return jwt.sign({ sub: id, username, role }, TOKEN_SECRET, { expiresIn: TOKEN_TTL });
}

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
    let role = payload.role ?? null;

    // Backfill from USER_MAP if needed
    if (username && (!id || !role)) {
      const m = USER_MAP[username];
      if (m) {
        if (!id)   id = m.id;
        if (!role) role = m.role;
      }
    }
	// Back-compat map if needed
    if (!id && username) {
      const m = USERS.find(u => u.username === username);
      if (m) id = m.id;
    }

    if (!id || !username || !payload.role ) {
      return res.status(401).json({ error: "Token missing required claims. Please log in again." });
    }

    if (!role) role = "user"; // safe default

    req.user = { id, username, role, claims: payload };
    next();
  } catch (err) {
    console.log(`JWT verification failed at URL ${req.url}`, err.name, err.message);
    return res.sendStatus(401);
  }
}

module.exports = { generateAccessToken, authenticateToken };
