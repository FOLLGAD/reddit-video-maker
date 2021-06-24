// This file contains all the ffmpeg-mappings
// The library fluent-ffmpeg is used as a wrapper for all calls to ffmpeg

const ffmpeg = require("fluent-ffmpeg"),
  tmp = require("tmp"),
  fs = require("fs");

tmp.setGracefulCleanup(); // Enforce graceful file cleanup

let tempFolderInfo = tmp.dirSync();
let tempFolder = tempFolderInfo.name;

function getConcat(videoPaths) {
  let txt = tmp.fileSync({ postfix: ".txt" });
  let tempPath = txt.name;

  fs.writeFileSync(tempPath, videoPaths.map((d) => `file '${d}'\n`).join(""));

  let f = ffmpeg()
    .input(tempPath)
    .inputOptions(["-f concat", "-safe 0"])
    .outputOptions("-c:s mov_text"); // c:s copy doesn't work for concatting subs, so re-encode it instead

  return f;
}

// Ffprobe
// Usually takes ~40ms
const probe = function (path) {
  return new Promise((res, rej) => {
    ffmpeg.ffprobe(path, (err, data) => {
      if (err) rej(err);
      else res(data);
    });
  });
};

module.exports.probe = probe;

// Make the song into the correct type for conformity
module.exports.normalizeSong = function (songPath, outputPath) {
  return new Promise((res, rej) => {
    ffmpeg(songPath)
      .on("end", () => {
        res();
      })
      .audioFrequency(24000)
      .audioChannels(1)
      .output(outputPath)
      .exec();
  });
};

// Same as normalizeSong but for video
module.exports.normalizeVideo = function (songPath, outputPath) {
  console.log("normalizing video");
  return new Promise((res, rej) => {
    ffmpeg(songPath)
      // Add a silent audio track (in case there is no audio already)
      // https://stackoverflow.com/a/12375018
      .inputOptions([
        "-f lavfi",
        "-i anullsrc=channel_layout=mono:sample_rate=24000",
      ])
      .audioCodec("aac")
      .audioFrequency(24000)
      .audioChannels(1)
      .fps(25)
      .outputOptions(["-pix_fmt yuv420p", "-shortest"])
      .videoCodec("libx264")
      .on("end", () => {
        res();
      })
      .output(outputPath)
      .exec();
  });
};

module.exports.concatAndReencode = function (videoPaths, outPath) {
  return new Promise((res, rej) => {
    getConcat(videoPaths)
      .videoCodec("libx264")
      .audioCodec("aac")
      .on("end", () => {
        res();
      })
      .on("error", (err) => {
        console.error(err);
        rej();
      })
      .mergeToFile(outPath, tempFolder);
  });
};

module.exports.combineImageAudio = function (
  imagePath,
  audioPath,
  outPath,
  delay = -0.35,
  text = null
) {
  return new Promise(async (res, rej) => {
    const audioInfo = await probe(audioPath);
    const totalTime = audioInfo.format.duration + delay;
    const f = ffmpeg(imagePath)
      .inputOptions(["-stream_loop 1"])
      .videoCodec("libx264")
      .fpsOutput(25) // No effect?
      .duration(totalTime)
      .input(audioPath)
      .audioCodec("aac")
      .audioFrequency(24000)
      .audioChannels(1)
      .outputOptions(["-pix_fmt yuv420p"])
      .output(outPath)
      .on("end", () => {
        res();
      })
      .on("error", (err) => {
        console.error(err);
        rej();
      });

    // Create a subtitle file and add to the mp4
    if (typeof text === "string") {
      const subFile = tmp.fileSync({ postfix: ".srt" });
      const endTime = totalTime;
      const h = Math.floor(endTime / 3600)
        .toString()
        .padStart(2, "0");
      const m = (Math.floor(endTime / 60) % 60).toString().padStart(2, "0");
      const s = (Math.floor(endTime) % 60).toString().padStart(2, "0");
      const ms = (endTime - Math.floor(endTime))
        .toString()
        .padEnd(3, "0")
        .slice(0, 3);

      // Typical SRT file format
      fs.writeFileSync(
        subFile,
        `1
00:00:00,000 --> ${h}:${m}:${s},${ms}
${text}`
      );
      f.input(subFile).outputOptions("-c:s mov_text");
    }

    f.exec();
  });
};

/* 
	Overlays audio over a video clip, repeating it ad inifinitum.
*/
module.exports.combineVideoAudio = function (
  videoPath,
  audioPath,
  outPath,
  volume = 1.0,
  skipSeconds = 0
) {
  return new Promise(async (res, rej) => {
    const videoInfo = await probe(videoPath);
    const audioExists = videoInfo.streams.some((s) => s.codec_type === "audio");

    let query = ffmpeg(videoPath).videoCodec("libx264").input(audioPath);

    if (skipSeconds > 0) {
      query.seekInput(skipSeconds); // Skip the audio
    }

    query
      .audioCodec("aac")
      .inputOptions([
        "-stream_loop -1", // Repeats audio until it hits the previously set duration [https://stackoverflow.com/a/34280687/6912118]
      ])
      .duration(videoInfo.format.duration); // Run for the duration of the video

    if (audioExists) {
      // https://superuser.com/a/1348093
      query
        .complexFilter([`[1:a]volume=${volume},apad[A];[0:a][A]amerge[a]`])
        .outputOptions(["-map 0:v", "-map [a]"]);
    } else if (volume !== 1.0) {
      // An audiostream doesn't exist for the video, so amerge will give an error.
      // Instead, just use the audio from the song.
      query
        .complexFilter([`[1:a]volume=${volume}[a]`])
        .outputOptions(["-map 0:v", "-map [a]"]);
    } else {
      query.outputOptions(["-map 0:v", "-map 1:a"]);
    }

    query
      .fpsOutput(25)
      .audioFrequency(24000)
      .audioChannels(1)
      .output(outPath)
      .on("end", () => {
        res();
      })
      .on("error", (err) => {
        console.error(err);
        rej();
      })
      .exec();
  });
};

module.exports.simpleConcat = function (videoPaths, outPath) {
  return new Promise((res, rej) => {
    getConcat(videoPaths)
      .videoCodec("copy")
      .audioCodec("copy")
      .on("end", () => {
        res();
      })
      .on("error", (err) => {
        console.error(err);
        rej();
      })
      .save(outPath);
  });
};
