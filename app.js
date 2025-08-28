const express = require("express");
const app = express();

const fileUpload = require("express-fileupload");
const path = require("path");

const { initDb } = require("./src/db");
const { STORAGE_ROOT } = require("./src/services/storageService");
const healthRoutes = require("./src/routes/healthRoutes");
const authRoutes = require("./src/routes/authRoutes");
const fileRoutes = require("./src/routes/fileRoutes");
const transcodeRoutes = require("./src/routes/transcodeRoutes");
const PORT = 3000;

app.use(express.json());
app.use(fileUpload({ createParentPath: true, limits: { fileSize: 1024 * 1024 * 1024 } }));

// serve a simple client if placed in ./public
app.use(express.static(path.join(__dirname, "public")));

// mount routes
app.use(healthRoutes);
app.use(authRoutes);
app.use(fileRoutes);
app.use(transcodeRoutes);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

(async () => {
  console.log("[boot] starting initDb()");
  try {
    await initDb();               // <— if we hang/crash, we'll see it now
    console.log("[boot] initDb OK");
  } catch (e) {
    console.error("[boot] initDb FAILED:", e);
    process.exit(1);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[boot] server listening on 0.0.0.0:${PORT}`);
  });
})();
