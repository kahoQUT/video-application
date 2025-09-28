// app.js
const express = require("express");
const path = require("path");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");

// routes
const authRoutes = require("./src/routes/authRoutes");
const fileRoutes = require("./src/routes/fileRoutes");
const transcodeRoutes = require("./src/routes/transcodeRoutes");
const healthRoutes = require("./src/routes/healthRoutes");
const storageRoutes = require("./src/routes/storageRoutes");

const app = express();

// ---------- Core middleware ----------
app.use(cors()); // ok for dev; lock down origin in prod
app.use(express.json());
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp", createParentPath: true }));
app.use(bodyParser.json());

// ---------- Static web client ----------
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/login", authRoutes);         // user login (JWT/Cognito)
app.use('/files', fileRoutes);
app.use('/presign', storageRoutes);
app.use('/transcode', transcodeRoutes);
// Health check
app.get("/healthz", (req, res) => res.json({ ok: true }));

// ---------- 404 & error handlers ----------
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------- Start server ----------
try {
  const PORT =  3000;
  app.listen(PORT, () => {
    console.log(`[boot] server listening on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("[boot] server failed", err);
  process.exit(1);
}
