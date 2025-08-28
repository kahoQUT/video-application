const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const STORAGE_ROOT = path.join(ROOT, "storage");
const ORIGINALS_DIR = path.join(STORAGE_ROOT, "originals");
const OUTPUTS_DIR = path.join(STORAGE_ROOT, "outputs");

[STORAGE_ROOT, ORIGINALS_DIR, OUTPUTS_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

module.exports = { ROOT, STORAGE_ROOT, ORIGINALS_DIR, OUTPUTS_DIR };
