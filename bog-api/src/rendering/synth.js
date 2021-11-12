// This file is for the tts calls

const fs = require("fs");
const { makeCall } = require("./daniel");
const { synthDaniel } = require("./our-daniel");
const { spawn } = require("child_process");
const tmp = require("tmp");
const escape = require("escape-html");

const AWS = require("aws-sdk");
const Polly = new AWS.Polly({
  signatureVersion: "v4",
  region: "eu-west-1",
});

// Copied from https://stackoverflow.com/a/56396333/6912118
const removeNonUtf8 = (characters) => {
  try {
    // ignore invalid char ranges
    var bytelike = unescape(encodeURIComponent(characters));
    characters = decodeURIComponent(escape(bytelike));
  } catch (error) {}
  // remove �
  characters = characters.replace(/\uFFFD/g, "");
  return characters;
};

const pollySynthSpeech = ({ text, voiceId }) => {
  const ssml = `<prosody volume="+6dB">${escape(
    removeNonUtf8(text)
  )}</prosody>`;
  return new Promise((resolve, reject) =>
    Polly.synthesizeSpeech(
      {
        Text: ssml,
        VoiceId: voiceId,
        OutputFormat: "mp3",
        TextType: "ssml",
      },
      (err, data) => {
        if (err) return rej(err);

        let file = tmp.fileSync({ postfix: ".mp3" });
        let filepath = file.name;

        // Write the binary audio content to a local file
        fs.writeFile(filepath, data.AudioStream, (err) => {
          if (err) {
            return reject(err);
          }
          resolve(filepath);
        });
      }
    )
  );
};

const voicemap = {
  "PT-BR": "Ricardo",
  ES: "Miguel",
  FR: "Mathieu",
  DE: "Hans",
  AR: "Zeina",
  RU: "Maxim",
};

module.exports.synthSpeech = async function ({ text, voice, language }) {
  if (!/[\d\w]/.test(text)) {
    // If no letter or number is in text, don't produce it
    return new Promise((_, rej) =>
      rej("Warning: TTS for current frame is empty")
    );
  }

  if (language) {
    return {
      audioPath: await pollySynthSpeech({
        text: text,
        voiceId: voicemap[language],
      }),
      delay: 0,
    };
  }

  switch (voice) {
    case "daniel":
      if (process.platform === "darwin") {
        // Darwin means Mac
        return {
          audioPath: await module.exports.macTTSToFile(text),
          delay: -0.35,
        };
      }
      // Else, fall back on the epic Oddcast api
      // return module.exports.synthOddcast(text)
      return {
        audioPath: await synthDaniel(text).then((p) => p.path),
        delay: -0.35,
      };

    case "linux":
      // Don't use
      return await module.exports.linuxTTSToFile(text);

    case "google-uk":
      return {
        audioPath: await module.exports.synthGoogle(text, {
          languageCode: "en-GB",
          voiceName: "en-GB-Wavenet-B",
          pitch: -4.4,
          speakingRate: 0.96,
        }),
        delay: -0.35,
      };

    case "google-us":
    default:
      // Fallthrough to default
      return {
        audioPath: await module.exports.synthGoogle(text, {
          speakingRate: 0.98,
          languageCode: "en-US",
          voiceName: "en-US-Wavenet-D",
          pitch: -2.0,
        }),
        delay: -0.35,
      };
  }
};

module.exports.linuxTTSToFile = function (text) {
  return new Promise((resolve) => {
    let file = tmp.fileSync({ postfix: ".mp3" });
    let filepath = file.name;

    let proc = spawn("espeak", ["-w", filepath, text]);
    proc.on("exit", () => {
      resolve(filepath);
    });
  });
};

module.exports.macTTSToFile = function (text) {
  return new Promise((resolve) => {
    let file = tmp.fileSync({ postfix: ".aiff" });
    let filepath = file.name;

    let proc = spawn("say", ["-o", filepath, "-v", "Daniel", text]);
    proc.on("exit", () => {
      resolve(filepath);
    });
  });
};

const textToSpeech = require("@google-cloud/text-to-speech");
const client = new textToSpeech.TextToSpeechClient();

const defaultVoiceSettings = {
  speakingRate: 0.98,
  languageCode: "en-US",
  voiceName: "en-US-Wavenet-D",
  pitch: -2.0,
};

module.exports.synthGoogle = function (
  text,
  voiceSettings = defaultVoiceSettings
) {
  const request = {
    input: { text: text },
    voice: {
      languageCode: voiceSettings.languageCode,
      ssmlGender: "MALE",
      name: voiceSettings.voiceName,
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: voiceSettings.speakingRate,
      pitch: voiceSettings.pitch,
    },
  };

  let promise = new Promise((resolve, reject) => {
    let file = tmp.fileSync({ postfix: ".mp3" });
    let filepath = file.name;

    client.synthesizeSpeech(request, (err, response) => {
      if (err) {
        return reject(err);
      }
      // Write the binary audio content to a local file
      fs.writeFile(filepath, response.audioContent, "binary", (err) => {
        if (err) {
          return reject(err);
        }
        resolve(filepath);
      });
    });
  });
  return promise;
};

module.exports.synthOddcast = function (text) {
  return new Promise((resolve, reject) => {
    makeCall(text)
      .then((res) => res.buffer())
      .then((buffer) => {
        let file = tmp.fileSync({ postfix: ".mp3" });
        let filepath = file.name;

        fs.writeFileSync(filepath, buffer);

        resolve(filepath);
      })

      .catch(() => {
        reject();
      });
  });
};
