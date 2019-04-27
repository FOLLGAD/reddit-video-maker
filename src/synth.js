const fs = require('fs')
const { makeCall } = require('./daniel')
const child_process = require('child_process')
let spawn = child_process.spawn

module.exports.synthDaniel = function synthDaniel(name, text) {
    let sanText = sanitize(text)

    return new Promise((resolve, reject) => {
        makeCall(sanText)
            .then(res => res.buffer())
            .then(buffer => {
                fs.writeFileSync(`../bad-audio-output/${name}`, buffer)

                let ffmpeg = spawn('ffmpeg', ['-y', `-i`, `../bad-audio-output/${name}`, '-c', 'copy', `../audio-output/${name}`])
                // ffmpeg -y -framerate 30 -loop 1 -i ../images/Q.png -i ../audio-output/Q.mp3 -vf pad=1920:1080:(ow-iw)/2:(oh-ih)/2:#ffffff -pix_fmt yuv420p -crf 20 -c:v libx264 -c:a aac -ar 24000 -r 30 ../video-temp/Q.ts
                ffmpeg.on('exit', statusCode => {
                    resolve(name)
                })
                ffmpeg.on('error', d => console.error(`child stderr:\n${d}`))
            })
            .catch((e) => {
                console.log(e)
                reject()
            })
    })
}

// Google API
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();
const voice = 'en-GB-Wavenet-D'
const rate = 1.25

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

// What synth will say instead
const foulDictionary = {
    fuck: 'f ',
    shit: 'sh ',
    bitch: 'b ',
    cunt: 'c ',
    nigga: 'n-word',
    asshole: 'a-hole',
    porn: 'p rn',
    damn: 'darn',
    dick: 'd k',
    penis: 'p s',
    ' rape': ' r e',
}

// What the html will display instead
const foulSpanDictionary = module.exports.foulSpanDictionary = {
    fuck: 'f<span class="blur">uck</span>',
    shit: 'sh<span class="blur">it</span>',
    bitch: 'b<span class="blur">itch</span>',
    cunt: 'c<span class="blur">unt</span>',
    nigga: 'ni<span class="blur">gg</span>a',
    asshole: 'a<span class="blur">ss</span>hole',
    porn: 'p<span class="blur">o</span>rn',
    damn: 'd<span class="blur">a</span>mn',
    dick: 'd<span class="blur">ic</span>k',
    penis: 'p<span class="blur">en</span>is',
    " rape": ' r<span class="blur">ap</span>e',
}

function sanitize(text) {
    for (key in foulDictionary) {
        // Replaces every occurance with the the corresponding value in the dictionary
        text = text.replace(new RegExp(key, 'gi'), foulDictionary[key])
    }
    return text.replace(/[\^\*]|(&gt;)|(&lt;)|\n/g, ' ')
        .replace(/[:;][\)\(]/g, '')
        .replace(/[\/\\]/g, ' ')
        .replace(/&amp;/g, ' & ')
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