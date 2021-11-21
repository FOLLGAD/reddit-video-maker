const { Song, File, Theme, Video } = require("./models");

const { render } = require("../rendering/render");
const db = require("./db");

const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const uuid = require("uuid");

require("dotenv").config();

const tokenSecret = process.env.TOKEN_SECRET;

const filesLocation = path.join(__dirname, "../../files");
const toFilesDir = (file) => (file ? path.join(filesLocation, file) : null);
const uuidFileName = (extension) =>
  extension ? uuid() + "." + extension : uuid();

const vidExtension = "mp4";

function createToken(email) {
  return new Promise((res, rej) => {
    jwt.sign({ email }, tokenSecret, { expiresIn: "30d" }, (err, token) => {
      if (err) return rej(err);
      return res(token);
    });
  });
}
function verifyToken(token) {
  return new Promise((res, rej) => {
    jwt.verify(token, tokenSecret, (err, payload) => {
      if (err) return rej(err);
      return res(payload);
    });
  });
}

function deleteFileCond(filename) {
  // Delete the file
  return new Promise((res, rej) => {
    if (filename) {
      fs.unlink(path.join(filesLocation, filename), (err) => {
        if (err) rej(err);
        else res();
      });
    }
  });
}

async function syncRenderFromRequest(video, options, owner, callback) {
  try {
    const ret = await renderFromRequest(video, options, owner);
    callback(null, ret);
  } catch (err) {
    callback(err, null);
  }
}

async function rerenderVideo(id) {
  const vid = await Video.findOne({
    _id: id,
  }).select({
    request_body: 1,
  });

  return renderFromRequest(vid._id, vid.request_body, vid.owner);
}

async function renderFromRequest(
  video,
  { options, questionData, commentData, name = null, preview = false },
  owner
) {
  await db.connect();

  let theme;
  try {
    theme = await Theme.findById(options.theme)
      .populate("intro")
      .populate("transition")
      .populate("outro");
    if (!theme) {
      throw { error: "WRONG_THEME", status: 400 };
    }
  } catch (e) {
    console.error(e);
    throw { error: "NO_THEME", status: 400 };
  }

  let song = options.song
    ? await Song.findById(options.song, { file: 1 }).populate("file")
    : null;

  let videoFile = await File.create({
    filename: uuidFileName(vidExtension),
  });

  await Video.updateOne(
    { _id: video },
    {
      theme: theme._id,
      name:
        (name || questionData.title) +
        (options.translate ? ` (${options.translate})` : ""),
      file: videoFile._id,
      preview,
      failed: false,
      ...(owner ? { owner } : {}),
    }
  );

  try {
    let renderOptions = Object.assign({}, theme, {
      outPath: toFilesDir(videoFile.filename),
      intro: toFilesDir(theme.intro && theme.intro.filename),
      transition: toFilesDir(theme.transition && theme.transition.filename),
      outro: toFilesDir(theme.outro && theme.outro.filename),
      song: song && toFilesDir(song.file.filename),
      name: theme.name,
      voice: theme.voice,
      voiceSpeed: theme.voiceSpeed,
      volume: theme.volume,
      callToAction: theme.callToAction,
      translate: options.translate,
    });

    await render(questionData, commentData, renderOptions);

    return { vid: video };
  } catch (err) {
    console.error("WHole video failed:", err);
    throw { vid: video };
  }
}

async function legacyRenderFromRequest(
  { options, questionData, commentData, name = null, preview = false },
  owner
) {
  let theme;
  try {
    theme = await Theme.findById(options.theme)
      .populate("intro")
      .populate("transition")
      .populate("outro");
    if (!theme) {
      throw { error: "WRONG_THEME", status: 400 };
    }
  } catch (e) {
    throw { error: "NO_THEME", status: 400 };
  }

  let song = options.song
    ? await Song.findById(options.song, { file: 1 }).populate("file")
    : null;

  let videoFile = await File.create({
    filename: uuidFileName(vidExtension),
  });

  let vid = new Video({
    theme: theme._id,
    name: name || questionData.title,
    file: videoFile._id,
    owner,
    preview,
  });
  await vid.save();

  let renderOptions = Object.assign({}, theme, {
    outPath: toFilesDir(videoFile.filename),
    intro: toFilesDir(theme.intro && theme.intro.filename),
    transition: toFilesDir(theme.transition && theme.transition.filename),
    outro: toFilesDir(theme.outro && theme.outro.filename),
    song: song && toFilesDir(song.file.filename),
    name: theme.name,
    voice: theme.voice,
    voiceSpeed: theme.voiceSpeed,
    volume: theme.volume,
    callToAction: theme.callToAction,
  });

  let renderPromise = render(questionData, commentData, renderOptions);

  return {
    renderPromise,
    vid,
  };
}

module.exports = {
  vidExtension,

  uuidFileName,

  filesLocation,

  toFilesDir,

  createToken,

  verifyToken,

  deleteFileCond,

  renderFromRequest,

  syncRenderFromRequest,

  legacyRenderFromRequest,

  rerenderVideo,
};
