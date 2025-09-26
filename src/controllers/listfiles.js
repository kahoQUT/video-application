
const { listVideosByOwner, listJobsByOwner } = require("../models/dynamodb");

async function listFiles(req, res) {
  const isAdmin = req.user.role === "admin";
  const owner   = req.user.sub;

  const limit  = Math.min(Number(req.query.limit || 25), 100);
  const cursor = req.query.cursor || null;

  let vids, jobs;
  if (isAdmin) {
    vids = await listVideosByOwner(owner, { limit, cursor });
    jobs = await listJobsByOwner(owner, { limit, cursor: req.query.cursorJobs });
  } else {
    vids = await listVideosByOwner(owner, { limit, cursor });
    jobs = await listJobsByOwner(owner, { limit, cursor: req.query.cursorJobs });
  }

  if (vids.nextCursor) res.set("X-Next-Cursor", vids.nextCursor);
  if (jobs.nextCursor) res.set("X-Next-Cursor-Jobs", jobs.nextCursor);

  res.set("Cache-Control","no-store");
  res.json({ originals: vids.items, outputs: jobs.items, page: { videosNext: vids.nextCursor, jobsNext: jobs.nextCursor } });
}
