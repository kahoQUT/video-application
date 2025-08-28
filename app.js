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
  await initDb();
  app.listen(PORT, () => {
    console.log(`Server on http://localhost:${PORT}`);
    console.log(`Storage: ${STORAGE_ROOT}`);
  });
})();
