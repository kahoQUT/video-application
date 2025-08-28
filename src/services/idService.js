const crypto = require("crypto");
function makeId(prefix = "") {
  return prefix + crypto.randomBytes(4).toString("hex") + Date.now().toString(36);
}
module.exports = { makeId };
