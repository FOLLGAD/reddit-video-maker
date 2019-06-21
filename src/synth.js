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
    ' rapist': ' r pist',
    cock: 'c ck',
    whore: 'hoe',
    pussy: 'p ssy',
    '.com': ' dot com',
}

function sanitize(text) {
    for (key in foulDictionary) {
        // Replaces every occurance with the the corresponding value in the dictionary
        text = text.replace(new RegExp(key, 'gi'), foulDictionary[key])
    }
    return text
}

// What the html will display instead
const foulSpanArray = module.exports.foulSpanArray = [
    /(f)(u)(ck)/,
    /(sh)(i)(t)/,
    /(b)(it)(ch)/,
    /(c)(un)(t)/,
    /(ni)(gg)(a)/,
    /(ni)(gge)(r)/,
    /(a)(ss)(hole)/,
    /(p)(o)(rn)/,
    /( r)(a)(pe)/,
    /( r)(a)(pist)/,
    /(c)(o)(ck)[^an]/, // doesnt match 'cockney', 'cockatrice'
    /(wh)(o)(re)/,
    /(p)(u)(ssy)/,
]

// Old swearword dict
const foulSpanDictionary = module.exports.foulSpanDictionary = {
    fuck: 'f<span class="blur">uck</span>',
    shit: 'sh<span class="blur">i</span>t',
    bitch: 'b<span class="blur">it</span>ch',
    cunt: 'c<span class="blur">un</span>t',
    nigga: 'ni<span class="blur">gg</span>a',
    asshole: 'a<span class="blur">ss</span>hole',
    porn: 'p<span class="blur">o</span>rn',
    " rape": ' r<span class="blur">ap</span>e',
    " rapist": ' r<span class="blur">ap</span>ist',
    cock: 'c<span class="blur">o</span>ck',
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