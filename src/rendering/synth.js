// This file is for the tts calls

const fs = require('fs')
const { makeCall } = require('./daniel')
const { spawn } = require('child_process')
const tmp = require('tmp')

module.exports.synthSpeech = function ({ text, voice }) {
	if (!/[\d\w]/.test(text)) { // If no letter or number is in text, don't produce it
		return new Promise((_, rej) => rej("Warning: TTS for current frame is empty"))
	}

	switch (voice) {
		case "daniel":
			if (process.platform === "darwin") {
				// Darwin means Mac
				return module.exports.macTTSToFile(text)
			}
			// Else, fall back on the epic Oddcast api
			return module.exports.synthOddcast(text)

		case "linux":
			// Don't use
			return module.exports.linuxTTSToFile(text)

		case "google-uk":
			return module.exports.synthGoogle(text, {
				languageCode: "en-GB",
				voiceName: "en-GB-Wavenet-B",
				pitch: -4.4,
				speakingRate: 0.96,
			})

		case "google-us": default:
			// Fallthrough to default
			return module.exports.synthGoogle(text, {
				speakingRate: 0.98,
				languageCode: "en-US",
				voiceName: "en-US-Wavenet-D",
				pitch: -2.0,
			})
	}
}

module.exports.linuxTTSToFile = function (text) {
	return new Promise(resolve => {
		let file = tmp.fileSync({ postfix: '.mp3' })
		let filepath = file.name

		let proc = spawn('espeak', ['-w', filepath, text])
		proc.on('exit', () => {
			resolve(filepath)
		})
	})
}

module.exports.macTTSToFile = function (text) {
	return new Promise(resolve => {
		let file = tmp.fileSync({ postfix: '.aiff' })
		let filepath = file.name

		let proc = spawn('say', ['-o', filepath, '-v', 'Daniel', text])
		proc.on('exit', () => {
			resolve(filepath)
		})
	})
}

const textToSpeech = require('@google-cloud/text-to-speech')
const client = new textToSpeech.TextToSpeechClient()

const defaultVoiceSettings = {
	speakingRate: 0.98,
	"languageCode": "en-US",
	"voiceName": "en-US-Wavenet-D",
	pitch: -2.0,
}

module.exports.synthGoogle = function (text, voiceSettings = defaultVoiceSettings) {
	const request = {
		input: { text: text },
		voice: { languageCode: voiceSettings.languageCode, ssmlGender: 'MALE', name: voiceSettings.voiceName },
		audioConfig: { audioEncoding: 'MP3', speakingRate: voiceSettings.speakingRate, pitch: voiceSettings.pitch },
	}

	let promise = new Promise((resolve, reject) => {
		let file = tmp.fileSync({ postfix: '.mp3' })
		let filepath = file.name

		client.synthesizeSpeech(request, (err, response) => {
			if (err) {
				return reject(err)
			}
			// Write the binary audio content to a local file
			fs.writeFile(filepath, response.audioContent, 'binary', err => {
				if (err) {
					return reject(err)
				}
				resolve(filepath)
			})
		})
	})
	return promise
}

module.exports.synthOddcast = function (text) {
	return new Promise((resolve, reject) => {
		makeCall(text)
			.then(res => res.buffer())
			.then(buffer => {
				let file = tmp.fileSync({ postfix: '.mp3' })
				let filepath = file.name

				fs.writeFileSync(filepath, buffer)
				resolve(filepath)
			})
			.catch(() => {
				reject()
			})
	})
}
