const fs = require('fs')
const { makeCall } = require('./daniel')
const { spawn } = require('child_process')
const tmp = require('tmp')

const settings = require('../env.json')

module.exports.synthSpeech = function (name, text) {
    if (!/[\d\w]/.test(text)) { // If no letter or number is in text, don't produce it
        return Promise.reject("Warning: TTS for current frame is empty")
    }

    switch (settings.ttsEngine) {
        case "mac":
            return module.exports.macTTSToFile(name, text)
        case "linux":
            return module.exports.linuxTTSToFile(name, text)
        case "oddcast":
        default:
            return module.exports.synthOddcast(name, text)
    }
}

module.exports.linuxTTSToFile = function (name, text) {
    return new Promise(resolve => {
        let proc = spawn('espeak', ['-w', `../audio-output/${name}`, text])
        proc.on('exit', () => {
            resolve(name)
        })
    })
}

module.exports.macTTSToFile = function (name, text) {
    return new Promise(resolve => {
        let file = tmp.fileSync({ postfix: '.aiff' })
        let filepath = file.name

        if (filepath.split('.').pop() !== 'aiff') {
            console.error('Format must be .aiff')
        }

        let proc = spawn('say', ['-o', filepath, '-v', 'Daniel', text])
        proc.on('exit', () => {
            resolve(filepath)
        })
    })
}


// Google API
// const textToSpeech = require('@google-cloud/text-to-speech');
// const client = new textToSpeech.TextToSpeechClient();
// const voice = 'en-GB-Wavenet-D'
// const rate = 1.25

// module.exports.synthGoogle = function (name, text) {
//     const request = {
//         input: { text: text },
//         voice: { languageCode: 'en-GB', ssmlGender: 'MALE', name: voice },
//         audioConfig: { audioEncoding: 'aiff', speakingRate: rate },
//     }
//     let promise = new Promise((resolve, reject) => {
//         client.synthesizeSpeech(request, (err, response) => {
//             if (err) {
//                 return reject(err)
//             }
//             // Write the binary audio content to a local file
//             fs.writeFile(`../audio-output/${name}`, response.audioContent, 'binary', (err) => {
//                 if (err) {
//                     return reject(err)
//                 }
//                 resolve(name)
//             })
//         })
//     })
//     return promise
// }

module.exports.synthOddcast = function (name, text) {
    return new Promise((resolve, reject) => {

        makeCall(text)
            .then(res => res.buffer())
            .then(buffer => {
                let file = tmp.fileSync()
                let filepath = file.name
                fs.writeFileSync(filepath, buffer)
                resolve(filepath)
            })
            .catch(() => {
                reject()
            })
    })
}

// List google voices
async function listVoices() {
    const [result] = await client.listVoices({});
    const voices = result.voices;
    console.log('Voices:');
    voices.filter(v => v.name.indexOf("en-GB") != -1).forEach(voice => {
        console.log(`Name: ${voice.name}`);
        console.log(`SSML Voice Gender: ${voice.ssmlGender}`);
        console.log(`Natural Sample Rate Hertz: ${voice.naturalSampleRateHertz}`);
        console.log(`Supported languages:`);

        voice.languageCodes.forEach(languageCode => {
            console.log(`    ${languageCode}`);
        });
    });
}
