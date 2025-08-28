const { spawn } = require("node:child_process");
const ffmpeg = require("@ffmpeg-installer/ffmpeg");

function buildArgs(inputPath, outPath, format) {
  const fmt = String(format || "").toLowerCase();
  switch (fmt) {
    case "mp4":
      return ["-y","-i",inputPath,"-c:v","libx264","-preset","veryfast","-c:a","aac","-b:a","128k","-movflags","+faststart",outPath];
    case "webm":
      return ["-y","-i",inputPath,"-c:v","libvpx-vp9","-b:v","0","-crf","32","-c:a","libopus","-b:a","128k",outPath];
    case "mkv":
      return ["-y","-i",inputPath,"-c:v","libx264","-c:a","aac",outPath];
    default:
      return ["-y","-i",inputPath,"-c","copy",outPath];
  }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(ffmpeg.path, args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", d => (err += d.toString()));
    p.on("close", code => (code === 0 ? resolve() : reject(new Error(err || `ffmpeg exited ${code}`))));
  });
}

module.exports = { buildArgs, runFfmpeg };
