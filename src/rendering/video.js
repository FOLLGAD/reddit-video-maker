// This file contains all the ffmpeg-mappings
// The library fluent-ffmpeg is used as a wrapper for all calls to ffmpeg

const ffmpeg = require('fluent-ffmpeg'),
	tmp = require('tmp'),
	fs = require('fs')

tmp.setGracefulCleanup() // Enforce graceful file cleanup

let tempFolderInfo = tmp.dirSync()
let tempFolder = tempFolderInfo.name

function getConcat(videoPaths) {
	let txt = tmp.fileSync()
	let tempPath = txt.name

	fs.writeFileSync(tempPath, videoPaths.map(d => `file '${d}'\n`).join(''))

	let f = ffmpeg().input(tempPath).inputOptions(['-f concat', '-safe 0'])
	return f
}

// Ffprobe
// Usually takes ~40ms
const probe = function (path) {
	return new Promise((res, rej) => {
		ffmpeg.ffprobe(path, (err, data) => {
			if (err) rej(err);
			else res(data);
		})
	})
}

// Make the song into the correct type for conformity
module.exports.normalizeSong = function (songPath, outputPath) {
	return new Promise((res, rej) => {
		ffmpeg(songPath)
			.on('end', () => {
				res()
			})
			.audioFrequency(24000)
			.audioChannels(1)
			.output(outputPath)
			.exec()
	})
}

// Same as normalizeSong but for video
module.exports.normalizeVideo = function (songPath, outputPath) {
	return new Promise((res, rej) => {
		ffmpeg(songPath)
			.audioCodec('aac')
			.audioFrequency(24000)
			.audioChannels(1)
			.fps(25)
			.videoCodec('libx264')
			.on('end', () => {
				res()
			})
			.output(outputPath)
			.exec()
	})
}

module.exports.concatAndReencode = function (videoPaths, outPath) {
	return new Promise((res, rej) => {
		getConcat(videoPaths)
			.videoCodec('libx264')
			.audioCodec('aac')
			.on('end', () => {
				res()
			})
			.on('error', err => {
				console.error(err)
				rej()
			})
			.mergeToFile(outPath, tempFolder)
	})
}

module.exports.combineImageAudio = function (imagePath, audioPath, outPath, delay = -0.35) {
	return new Promise(async (res, rej) => {
		let audioInfo = await probe(audioPath)
		ffmpeg(imagePath)
			.inputOptions([
				'-stream_loop 1',
			])
			.videoCodec('libx264')
			.fpsOutput(25) // No effect?
			.duration(audioInfo.format.duration + delay)
			.input(audioPath)
			.audioCodec('aac')
			.audioFrequency(24000)
			.outputOptions([
				'-pix_fmt yuv420p',
			])
			.output(outPath)
			.on('end', () => {
				res()
			})
			.on('error', err => {
				console.error(err)
				rej()
			})
			.exec()
	})
}

/* 
	Overlays audio over a video clip, repeating it ad inifinitum.
*/
module.exports.combineVideoAudio = function (videoPath, audioPath, outPath) {
	return new Promise(async (res, rej) => {
		let videoInfo = await probe(videoPath)

		ffmpeg(videoPath)
			.videoCodec('libx264')
			.input(audioPath)
			.audioCodec('aac')
			.inputOptions([
				'-stream_loop -1', // Repeats audio until it hits the previously set duration [https://stackoverflow.com/a/34280687/6912118]
			])
			.duration(videoInfo.format.duration) // Run for the duration of the video
			.complexFilter(['[0:a][1:a] amerge=inputs=2 [a]'])
			.fpsOutput(25)
			.outputOptions([
				'-map 0:v',
				'-map [a]',
				'-shortest', // Cut off when video is done.
			])
			.audioChannels(1)
			.output(outPath)
			.on('end', () => {
				res()
			})
			.on('error', err => {
				console.error(err)
				rej()
			})
			.exec()
	})
}

module.exports.simpleConcat = function (videoPaths, outPath) {
	return new Promise((res, rej) => {
		getConcat(videoPaths)
			.videoCodec('copy')
			.audioCodec('copy')
			.on('end', () => {
				res()
			})
			.on('error', err => {
				console.error(err)
				rej()
			})
			.save(outPath)
	})
}
