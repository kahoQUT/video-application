// src/middleware/cognitoAuth.js
const { CognitoJwtVerifier } = require("aws-jwt-verify");

const userPoolId = 'ap-southeast-2_fSgRzAeRZ';
const clientId   = '1t7026rcc00tm72k5dc39vimcn';

if (!userPoolId || !clientId) {
  console.warn("[auth] COGNITO_USER_POOL_ID / COGNITO_CLIENT_ID not set");
}

const idVerifier = CognitoJwtVerifier.create({
  userPoolId,
  tokenUse: "id",
  clientId,
});
const accessVerifier = CognitoJwtVerifier.create({
  userPoolId,
  tokenUse: "access",
  clientId,
});

async function verifyAny(token) {
  try { return await accessVerifier.verify(token); } catch {}
  return await idVerifier.verify(token); // throws if invalid
}

function authenticateCognito() {
  return async (req, res, next) => {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7).trim() : null;
    if (!token) return res.status(401).json({ error: "Missing Bearer token" });

    try {
      const payload = await verifyAny(token);
      // Normalize user shape for controllers
      const sub = payload.sub;                         // stable user id (UUID)
      const username = payload["cognito:username"] || payload.username || payload.email || sub;
      const groups = payload["cognito:groups"] || [];
      const role = groups.includes("admin") ? "admin" : "user";

      req.user = { sub, username, role, claims: payload };
      next();
    } catch (e) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  };
}

// Optional guard if you want admin-only endpoints
function requireAdmin(req, res, next) {
  if (req.user?.role === "admin") return next();
  return res.status(403).json({ error: "Admin only" });
}

module.exports = { authenticateCognito, requireAdmin };
