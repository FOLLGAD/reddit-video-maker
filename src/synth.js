const fs = require('fs')
const { makeCall } = require('./daniel')

module.exports.synthDaniel = function synthDaniel(name, text) {
    text = text.replace(/&/g, 'and') // '&' doesn't work for Daniel, he says &amp instead
    let sanText = sanitize(text)

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

// Google API
/* 
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();
const voice = 'en-GB-Wavenet-D'
const rate = 1.25
*/

/*
module.exports.synthGoogle = function synthGoogle(name, text) {
    let sanText = sanitize(text)

    const request = {
        input: { text: sanText },
        voice: { languageCode: 'en-GB', ssmlGender: 'MALE', name: voice },
        audioConfig: { audioEncoding: 'MP3', speakingRate: rate },
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
*/

// What synth will say instead
const foulDictionary = {
    fuck: 'f ',
    shit: 'sh ',
    bitch: 'b ',
    cunt: 'c ',
    nigga: 'n-word',
    asshole: 'a-hole',
    porn: 'p rn',
    ' rape': ' r e',
}

// What the html will display instead
const foulSpanDictionary = module.exports.foulSpanDictionary = {
    fuck: 'f<span class="blur">uck</span>',
    shit: 'sh<span class="blur">i</span>t',
    bitch: 'b<span class="blur">it</span>ch',
    cunt: 'c<span class="blur">un</span>t',
    nigga: 'ni<span class="blur">gg</span>a',
    asshole: 'a<span class="blur">ss</span>hole',
    porn: 'p<span class="blur">o</span>rn',
    " rape": ' r<span class="blur">ap</span>e',
}

function sanitize(text) {
    for (key in foulDictionary) {
        // Replaces every occurance with the the corresponding value in the dictionary
        text = text.replace(new RegExp(key, 'gi'), foulDictionary[key])
    }
    return text
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