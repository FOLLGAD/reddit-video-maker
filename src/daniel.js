const fetch = require('node-fetch')
const crypto = require('crypto')

function getMd5Hash(string) {
    let md5Sum = crypto.createHash('md5')
    md5Sum.update(string)
    return md5Sum.digest('hex')
}

// Reverse-engineering of the 'demo' api used on http://ttsdemo.com (max ~600 chars)
// No known request-limit
function getChecksum(text, engine = 4, language = 1, voice = 5, acc = 5883747) {
    return getMd5Hash(`${engine}${language}${voice}` + text + '1' + 'mp3' + acc + 'uetivb9tb8108wfj')
}

// Make call will return a request with the mp3 file
module.exports.makeCall = function (text, engine = 4, language = 1, voice = 5) {
    text = text.replace('\n', '').trim()
    let newtext = encodeURIComponent(text)
    let acc = 5883747
    let checksum = getChecksum(text, engine, language, voice, acc)

    return new Promise((resolve, reject) =>
        fetch(`http://cache-a.oddcast.com/tts/gen.php?EID=${engine}&LID=${language}&VID=${voice}&TXT=${newtext}&IS_UTF8=1&EXT=mp3&FNAME&ACC=${acc}&API&SESSION&CS=${checksum}&cache_flag=3`, {
            headers: {
                'Host': 'cache-a.oddcast.com',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0',
                'Accept': 'audio/webm,audio/ogg,audio/wav,audio/*;q=0.9,application/ogg;q=0.7,video/*;q=0.6,*/*;q=0.5',
                'Accept-Language': 'sv-SE,sv;q=0.8,en-US;q=0.5,en;q=0.3',
                'Range': 'bytes=0-',
                'Referer': 'http://www.oddcast.com/ttsdemo/index.php',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Cookie': 'lastLoginURL=https%3A%2F%2Fvhss.oddcast.com%2Fadmin%2F%3F; y=esAHc9ANyahS30fiLAc00',
            }
        }).then(res => {
            if (res.headers.get('Content-Type') !== 'audio/mpeg') {
                console.log(res.headers.get('Content-Type'))
                console.error('An error ocurred with Daniel:', newtext)
                reject()
            } else {
                resolve(res)
            }
        })
    )
}