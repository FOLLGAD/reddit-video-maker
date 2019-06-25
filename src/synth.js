const fs = require('fs')
const { makeCall } = require('./daniel')
const { sanitizeSynth } = require('./sanitize')
const { spawn } = require('child_process')

module.exports.macTTSToFile = function (name, text) {
    return new Promise(resolve => {
        text = text.replace(/&/g, 'and') // '&' doesn't work for Daniel, he says &amp instead
        text = text.replace('\n', '').trim()

        if (name.split('.').pop() !== 'aiff') {
            console.error('Format must be .aiff')
        }

        let proc = spawn('say', ['-o', `../audio-output/${name}`, '-v', 'Daniel', text])
        proc.on('exit', () => {
            resolve(name)
        })
    })
}

module.exports.synthOddcast = function (name, text) {
    text = text.replace(/&/g, 'and') // '&' doesn't work for Daniel, he says &amp instead
    let sanText = sanitizeSynth(text)

    return new Promise((resolve, reject) => {
        let reg = /[\d\w]/

        if (!reg.test(sanText)) { // If no letter or number is in text, don't produce it
            reject()
            return
        }

        makeCall(sanText)
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