const jwt = require("jsonwebtoken");
const { generateAccessToken } = require("../../jwt");
const JWT_SECRET = "e9aae26be08551392be664d620fb422350a30349899fc254a0f37bfa1b945e36ff20d25b12025e1067f9b69e8b8f2ef0f767f6fff6279e5755668bf4bae88588";
// Simple hard-coded users (per assignment)
const USERS = [
  { id: 1, username: "admin", password: "admin", admin: true },
  { id: 2, username: "bob", password: "password1", admin: false },
];

function login(req, res) {
  const { username, password } = req.body || {};
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
	console.log("Successful login by user", username);
	const token = generateAccessToken({ id: user.id, username: user.username });
  res.json({ token });
}

module.exports = { login };

