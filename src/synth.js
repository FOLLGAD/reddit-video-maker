const fs = require('fs')
const { makeCall } = require('./daniel')
const { sanitizeSynth } = require('./sanitize')
const { spawn } = require('child_process')

module.exports.synthSpeech = function (name, text) {
    let sanText = sanitizeSynth(text)

    if (!/[\d\w]/.test(sanText)) { // If no letter or number is in text, don't produce it
        return Promise.reject("Error: TTS is empty")
    }

    return module.exports.synthOddcast(name, sanText)

    // if (process.env.synthType === 'google') {
    //     return module.exports.linuxTTSToFile(name, sanText)
    // } else {
    //     return module.exports.macTTSToFile(name, sanText)
    // }
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
        if (name.split('.').pop() !== 'aiff') {
            console.error('Format must be .aiff')
        }

        let proc = spawn('say', ['-o', `../audio-output/${name}`, '-v', 'Daniel', text])
        proc.on('exit', () => {
            resolve(name)
        })
    })
}


// Google API
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();
const voice = 'en-GB-Wavenet-D'
const rate = 1.25

module.exports.synthGoogle = function (name, text) {
    const request = {
        input: { text: text },
        voice: { languageCode: 'en-GB', ssmlGender: 'MALE', name: voice },
        audioConfig: { audioEncoding: 'aiff', speakingRate: rate },
    }
    let promise = new Promise((resolve, reject) => {
        client.synthesizeSpeech(request, (err, response) => {
            if (err) {
                return reject(err)
            }
            // Write the binary audio content to a local file
            fs.writeFile(`../audio-output/${name}`, response.audioContent, 'binary', (err) => {
                if (err) {
                    return reject(err)
                }
                resolve(name)
            })
        })
    })
    return promise
}

module.exports.synthOddcast = function (name, text) {
    return new Promise((resolve, reject) => {
        makeCall(text)
            .then(res => res.buffer())
            .then(buffer => {
                fs.writeFileSync(`../audio-output/${name}`, buffer)
                resolve(name)
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