const jwt = require("jsonwebtoken");
const JWT_SECRET = "e9aae26be08551392be664d620fb422350a30349899fc254a0f37bfa1b945e36ff20d25b12025e1067f9b69e8b8f2ef0f767f6fff6279e5755668bf4bae88588";
// Simple hard-coded users (per assignment)
const USERS = [
  { id: 1, username: "alice", password: "password1" },
  { id: 2, username: "bob", password: "password2" },
];

function login(req, res) {
  const { username, password } = req.body || {};
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
}

module.exports = { login };

