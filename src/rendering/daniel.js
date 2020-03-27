// This file is for the Oddcast API calls

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

function getTextPromise(engine, language, voice, text, acc, checksum) {
	return new Promise((resolve, reject) => {
		fetch(`http://cache-a.oddcast.com/tts/gen.php?EID=${engine}&LID=${language}&VID=${voice}&TXT=${text}&IS_UTF8=1&EXT=mp3&FNAME&ACC=${acc}&API&SESSION&CS=${checksum}&cache_flag=3`, {
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
			},
		}).then(res => {
			if (res.headers.get('Content-Type') === 'audio/mpeg') {
				resolve(res)
			} else {
				console.log("Got Content-Type:", res.headers.get('Content-Type'))
				console.error('An error ocurred with Daniel on:', text)
				reject(new Error("400"))
			}
		}).catch(err => {
			console.error("Daniel: Request failed")
			reject(err)
		})
	})
}

// Make call will return a request with the mp3 file
// "text" cannot include some characters, like [><\n]
// Usually takes between 2-5 seconds
module.exports.makeCall = async function (text, engine = 4, language = 1, voice = 5) {
	text = text
		.replace(/&/g, ' and ') // '&' doesn't work for Daniel, he says &amp instead
		.replace(/[<>]/g, '')   // < and > makes the request fail
		.replace('\n', '')
		.trim()                 // remove unneccessary whitespace

	const newtext = encodeURIComponent(text)
	const acc = 5883747
	const checksum = getChecksum(text, engine, language, voice, acc)

	let tries = 0
	while (tries < 1000) {
		tries++
		try {
			// Timout at 5 seconds
			let t = await timeoutPromise(5000, getTextPromise(engine, language, voice, newtext, acc, checksum))
			return t
		} catch (err) {
			if (err.message == 400 && tries > 3) {
				throw err
			}
			let retrytime = 1000
			console.error(`Daniel: Request failed. Retrying again in ${retrytime / 1000} seconds...`)
			await new Promise(r => setTimeout(r, retrytime)) // Wait
		}
	}

	throw new Error("Daniel: Too many failed attempts, skipping")
}

function timeoutPromise(ms, promise) {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			reject(new Error("promise timeout"))
		}, ms);
		promise.then(
			(res) => {
				clearTimeout(timeoutId);
				resolve(res);
			},
			(err) => {
				clearTimeout(timeoutId);
				reject(err);
			}
		);
	})
}
