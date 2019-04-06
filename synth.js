const fs = require('fs')
const textToSpeech = require('@google-cloud/text-to-speech');
const client = new textToSpeech.TextToSpeechClient();

// Construct the request

function synth(text = "I worked at an upscale seafood restaurant for about a year.") {
    const request = {
        input: { text },
        voice: { languageCode: 'en-GB', ssmlGender: 'MALE' },
        audioConfig: { audioEncoding: 'MP3' },
    };
    client.synthesizeSpeech(request, (err, response) => {
        if (err) {
            console.error('ERROR:', err);
            return;
        }

        // Write the binary audio content to a local file
        fs.writeFile(Date.now() + '.mp3', response.audioContent, 'binary', err => {
            if (err) {
                console.error('ERROR:', err);
                return;
            }
        });
    });
}

module.exports.synth = synth