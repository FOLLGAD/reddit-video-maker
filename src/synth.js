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
const foulDict2 = [{
    regex: /fuck/,
    replace: "f ",
}, {
    regex: /shit/,
    replace: "sh ",
}, {
    regex: /bitch/,
    replace: "b ",
}, {
    regex: /cunt/,
    replace: "c ",
}, {
    regex: /nigga/,
    replace: "n-word",
}, {
    regex: /asshole/,
    replace: "a-hole",
}, {
    regex: / ass /,
    replace: " ay ",
}, {
    regex: /pornography/,
    replace: "p graphy",
}, {
    regex: /porn/,
    replace: "p rn",
}, {
    regex: / rape/,
    replace: " r e",
}, {
    regex: / rapist/,
    replace: " r pist",
}, {
    regex: /cock/,
    replace: "c k",
}, {
    regex: /whore/,
    replace: "or",
}, {
    regex: /pussy/,
    replace: "p s y",
}, {
    regex: /dick/,
    replace: "d ",
}, {
    regex: /tits/,
    replace: "t ts",
}, {
    regex: /titties/,
    replace: "t ts",
}, {
    regex: / cum/,
    replace: "c m",
}, {
    regex: /sex/,
    replace: "s",
}, {
    regex: /.com/,
    replace: " dot com"
}]
const foulDictionary = {
    fuck: 'f ',
    shit: 'sh ',
    bitch: 'b ',
    cunt: 'c ',
    nigga: 'n-word',
    asshole: 'a-hole',
    ' ass ': ' ay ',
    pornography: 'p graphy',
    porn: 'p rn',
    ' rape': ' r e',
    ' rapist': ' r pist',
    cock: 'c k',
    whore: 'or',
    pussy: 'p s y',
    dick: 'd ',
    tits: 't ts',
    titties: 't ts',
    ' cum': 'c m',
    sex: 's',
    '\\.com': ' dot com',
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
    /(f)(uck)()/,
    /(sh)(it)()/,
    /(b)(it)(ch)/,
    /(c)(un)(t)/,
    /(ni)(gg)(a)/,
    /(ni)(gge)(r)/,
    /(a)(ss)(hole)/,
    /( a)(ss)( )/,
    /(p)(or)(n)/,
    /( c)(u)(m)/,
    /( r)(ap)(e)/,
    /( r)(ap)(ist)/,
    /(c)(o)(ck[^an])/, // doesnt match 'cockney', 'cockatrice'
    /( t)(i)(ts)/,
    /(t)(it)(ties)/,
    /( d)(ic)(k)/,
    /(wh)(o)(re)/,
    /(p)(us)(sy)/,
    /(s)(e)(x)/,
]

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