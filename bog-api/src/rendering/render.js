let { renderComment, renderQuestion } = require("./construct-html");
let { combineVideoAudio, simpleConcat, probe } = require("./video");
let tmp = require("tmp");
const Ffmpeg = require("fluent-ffmpeg");
const fs = require("fs/promises");
const fstest = require("fs");

const vidExtension = "mp4";

async function renderFromComments(
  question,
  videolist,
  outPath,
  { intro, outro, song, volume }
) {
  let dir = tmp.dirSync({ unsafeCleanup: true });

  console.log("Adding transitions, intro and outro...");
  let withoutSong = tmp.fileSync({
    tmpdir: dir.name,
    postfix: "." + vidExtension,
    prefix: "transitions-",
  });

  let fullList = [question, ...videolist];

  let introDuration = 0;
  if (intro) {
    let introProbe = await probe(intro);
    introDuration = parseFloat(introProbe.format.duration);
    fullList.unshift(intro);
  }

  let outroDuration = 0;
  if (outro) {
    let outroProbe = await probe(outro);
    outroDuration = parseFloat(outroProbe.format.duration);
    fullList.push(outro);
  }

  await simpleConcat(fullList, withoutSong.name);

  if (song) {
    console.log("Adding song...");

    const f = async () => {
      const videoInfo = await probe(withoutSong.name);
      const wholeDuration = videoInfo.format.duration;
      const outroTimestamp = wholeDuration - outroDuration || 9999;

      let realVolume = parseFloat(volume) / 100;
      if (isNaN(realVolume)) realVolume = 0.2;

      console.log("vol:", realVolume, volume);

      return await new Promise((res, rej) =>
        Ffmpeg(withoutSong.name)
          .outputOptions("-c:s mov_text")
          .videoCodec("libx264")
          .input(song)
          .audioCodec("aac")
          .inputOptions([
            "-stream_loop -1", // Repeats audio until it hits the previously set duration [https://stackoverflow.com/a/34280687/6912118]
          ])
          .duration(wholeDuration) // Run for the duration of the video
          // If t <= endTime(intro) then vol = 0,
          // else if t > startTime(outro) then vol = loweredVol,
          // else linear increase to 1.00
          .complexFilter([
            `[1:a]volume=eval=frame:volume='if(lte(t, ${introDuration}), 0.00, if(gt(t, ${outroTimestamp}), max(0.0, min(1.0, ${realVolume} + (t-${outroTimestamp}) / 2)), ${realVolume}))' , apad[A] ; [0:a][A]amerge[a]`,
          ])
          // .complexFilter([`[0:a][1:a]amerge[a]`])
          .outputOptions(["-map 0:v", "-map [a]", "-map 0:s?"])
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
          .exec()
      );
    };

    await f();
  } else {
    console.log("No song selected");
    await fs.rename(withoutSong.name, outPath);
  }

  dir.removeCallback();
}

async function renderQuestionOnly(question, outPath, { intro, outro, song }) {
  let soundFile;

  let queue = [];
  // Add song to question file
  if (song) {
    console.log("Adding sound...");
    soundFile = tmp.fileSync({
      postfix: "." + vidExtension,
      prefix: "soundfile-",
    });
    await combineVideoAudio(question, song, soundFile);
    queue.push(soundFile);
  } else {
    console.log("No song selected");
    queue.push(question);
  }

  if (intro) queue.unshift(intro); // Insert intro at first pos
  if (outro) queue.push(outro);

  await simpleConcat(queue, outPath);

  if (soundFile) soundFile.removeCallback();
}

function insertTransitions(videolist, transitionPath) {
  let arr = [];
  videolist.forEach((video, i, a) => {
    arr.push(video);
    if (i !== a.length - 1) {
      arr.push(transitionPath);
    }
  });

  return arr;
}

module.exports.render = async function (questionData, commentData, options) {
  console.log("Started rendering");
  let start = Date.now();
  let videolist = [];

  console.log(
    "Rendering",
    commentData.length,
    commentData.length === 1 ? "comment" : "comments"
  );
  for (let i = 0; i < commentData.length; i++) {
    try {
      let commentPath = await renderComment({
        commentData: commentData[i],
        voice: options.voice,
        commentIndex: i,
        callToAction: options.callToAction,
      });
      videolist.push(commentPath);
      console.log("Successfully rendered comment", i);
    } catch (e) {
      console.error(e);
      console.log(
        "Comment number",
        i,
        "failed to render. It will not be added."
      );
    }
  }

  const withTransitions = options.transition
    ? insertTransitions(videolist, options.transition)
    : videolist;

  try {
    console.log("Rendering question...");
    let question = await renderQuestion({ questionData, voice: options.voice });

    console.log("Concatting...");

    if (commentData.length > 0) {
      await renderFromComments(
        question,
        withTransitions,
        options.outPath,
        options
      );
    } else {
      await renderQuestionOnly(question, options.outPath, options);
    }
    console.log("Finished render in", (Date.now() - start) / 1000 + "s");
  } catch (e) {
    console.error(e);
    throw new Error("Rendering failed");
  }
};
