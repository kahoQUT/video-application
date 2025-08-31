#!/usr/bin/env node
/**
 * Load driver for your /transcode endpoint (CPU stress).
 * Node 18+ required (uses global fetch).
 *
 * Usage:
 *   node load-transcodes.js [HOST] [USER] [PASS] [DURATION_SECONDS] [CONCURRENCY]
 *   e.g. node load-transcodes.js http://localhost:3000 admin adminpass 300 8
 *
 * Or env vars:
 *   HOST, USERNAME, PASSWORD, DURATION, CONCURRENCY, FORMATS
 *
 * Tips:
 *   - webm (VP9) is CPU-heavy → best for hitting >80% CPU
 *   - run `mpstat 1 300` in another terminal to capture CPU proof
 */

const os = require("os");

const args = process.argv.slice(2);
const HOST        = process.env.HOST        || args[0] || "http://localhost:3000";
const USERNAME    = process.env.USERNAME    || args[1] || "admin";
const PASSWORD    = process.env.PASSWORD    || args[2] || "admin";
const DURATION    = Number(process.env.DURATION || args[3] || 300); // seconds
const CONCURRENCY = Number(process.env.CONCURRENCY || args[4] || os.cpus().length);
const FORMATS     = (process.env.FORMATS || "webm,mp4,mkv").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function login() {
  const res = await fetch(`${HOST}/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: HTTP ${res.status}`);
  const data = await res.json();
  if (!data.token) throw new Error("No token in /login response");
  return data.token;
}

async function listFiles(token) {
  const res = await fetch(`${HOST}/files`, {
    headers: { authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`GET /files failed: HTTP ${res.status}`);
  const data = await res.json();
  return (data.originals || []).map(o => o.id);
}

async function transcode(token, videoId, format) {
  const res = await fetch(`${HOST}/transcode`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ videoId, format })
  });
  // Expected 202; but accept 200-range in case you changed it
  if (res.status >= 200 && res.status < 300) return true;
  // Ignore conflicts/races quietly (e.g., two same (videoId,format) at once)
  return false;
}

(async () => {
  console.log(`[*] Target: ${HOST}`);
  console.log(`[*] User: ${USERNAME}`);
  console.log(`[*] Duration: ${DURATION}s, Concurrency: ${CONCURRENCY}, Formats: ${FORMATS.join(", ")}`);

  const token = await login();
  const vids = await listFiles(token);
  if (vids.length === 0) {
    console.error("!! No originals found. Upload at least one video first.");
    process.exit(1);
  }
  console.log(`[*] Found ${vids.length} originals: ${vids.join(", ")}`);

  // Build a rotating list of unique (videoId, format) pairs
  const pairs = [];
  for (const v of vids) for (const f of FORMATS) pairs.push([v, f]);
  if (pairs.length === 0) {
    console.error("!! No work pairs formed.");
    process.exit(1);
  }

  let sent = 0, ok = 0, fail = 0;
  let idx = 0;
  const endAt = Date.now() + DURATION * 1000;
  let stop = false;

  process.on("SIGINT", () => { stop = true; console.log("\n[!] Interrupted — draining…"); });

  const workers = Array.from({ length: CONCURRENCY }, (_, wid) => (async () => {
    while (!stop && Date.now() < endAt) {
      const [vid, fmt] = pairs[idx++ % pairs.length];
      sent++;
      try {
        const okReq = await transcode(token, vid, fmt);
        ok += okReq ? 1 : 0;
      } catch {
        fail++;
        // short backoff on error to avoid tight loop if server momentarily 500s
        await sleep(50);
      }
      // tiny jitter helps spread requests
      if ((wid & 3) === 0) await sleep(5);
    }
  })());

  // Stats printer
  const t0 = Date.now();
  const timer = setInterval(() => {
    const elapsed = (Date.now() - t0) / 1000;
    const rate = (sent / Math.max(1, elapsed)).toFixed(1);
    process.stdout.write(`\r[sent=${sent} ok=${ok} fail=${fail} rate=${rate}/s elapsed=${elapsed.toFixed(1)}s]`);
  }, 1000);

  await Promise.all(workers).catch(() => {});
  clearInterval(timer);
  console.log(`\n[*] Done. sent=${sent} ok=${ok} fail=${fail}`);

  console.log("\nTip: run `mpstat 1 300` (Linux) in another terminal to capture CPU >80% for your report.");
})().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
