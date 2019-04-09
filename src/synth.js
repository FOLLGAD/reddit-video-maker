const fs = require('fs')

const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

let voice = 'en-GB-Wavenet-D'
let rate = 1.25

function synth(name, text) {
    let santext = sanitize(text)

    const request = {
        input: { text: santext },
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

const foulDictionary = {
    fuck: 'f ',
    shit: 'sh ',
    bitch: 'b ',
    cunt: 'c ',
}

const foulSpanDictionary = module.exports.foulSpanDictionary = {
    fuck: 'f<span class="blur">uck</span>',
    shit: 'sh<span class="blur">it</span>',
    bitch: 'b<span class="blur">itch</span>',
    cunt: 'c<span class="blur">unt</span>',
}

function sanitize(text) {
    for (key in foulDictionary) {
        text = text.replace(new RegExp(key, 'gi'), foulDictionary[key])
    }
    text = text.replace(/[\^,\*]|(&gt;)|(&lt;)/g, ' ')
    return text
}

module.exports.synth = synth

async function listVoices() {
    const [result] = await client.listVoices({});
    const voices = result.voices;
    console.log('Voices:');
    voices.filter(v => v.name.indexOf("en-GB") != -1).forEach(voice => {
        console.log(`Name: ${voice.name}`);
        console.log(`  SSML Voice Gender: ${voice.ssmlGender}`);
        console.log(`  Natural Sample Rate Hertz: ${voice.naturalSampleRateHertz}`);
        console.log(`  Supported languages:`);
        voice.languageCodes.forEach(languageCode => {
            console.log(`    ${languageCode}`);
        });
    });
}