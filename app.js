// app.js
const express = require("express");
const path = require("path");
const morgan = require("morgan");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");

// routes
const authRoutes = require("./src/routes/authRoutes");
const fileRoutes = require("./src/routes/fileRoutes");
const transcodeRoutes = require("./src/routes/transcodeRoutes");

const app = express();

// ---------- Core middleware ----------
app.use(cors()); // ok for dev; lock down origin in prod
app.use(express.json());
app.use(fileUpload({ useTempFiles: true, tempFileDir: "/tmp", createParentPath: true }));
app.use(bodyParser.json());

// ---------- Static web client ----------
app.use(express.static(path.join(__dirname, "public"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".css")) {
      res.setHeader("Content-Type", "text/css");
    }
    if (filePath.endsWith(".js")) {
      res.setHeader("Content-Type", "application/javascript");
    }
  }
}));

// Routes
app.use("/login", authRoutes);         // user login (JWT/Cognito)
app.use("/files", fileRoutes);         // list files
app.use("/upload", fileRoutes);        // file upload
app.use("/transcode", transcodeRoutes);// start/view transcode jobs
app.use("/download", fileRoutes);      // file download

// Health check
app.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

// ---------- 404 & error handlers ----------
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Internal server error" });
});

// ---------- Start server ----------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[boot] server listening on http://localhost:${PORT}`);
});

