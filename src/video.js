// This file contains all the ffmpeg-mappings
// The library fluent-ffmpeg is used as a wrapper for all calls to ffmpeg

const ffmpeg = require('fluent-ffmpeg'),
	tmp = require('tmp'),
	fs = require('fs')

tmp.setGracefulCleanup() // Enforce graceful file cleanup

let color = '#19191a' // Dark mode
// let color = '#ffffff' // Light mode

// ffmpeg -i transition_new_dark.mp4 -c:a aac -c:v libx264 -r 25 -ac 2 -ar 24000 transition_dark.mkv

let intermediaryFileFormat = 'mkv'
let inputFormat = 'matroska'

let tempFolderInfo = tmp.dirSync()
let tempFolder = tempFolderInfo.name

function getConcat(videoPaths) {
	let txt = tmp.fileSync()
	let tempPath = txt.name

	fs.writeFileSync(tempPath, videoPaths.map(d => `file '${d}'\n`).join(''))

	let f = ffmpeg().input(tempPath).inputOptions(['-f concat', '-safe 0'])
	return f
}

const probe = function (path) {
	return new Promise((res, rej) => {
		ffmpeg.ffprobe(path, (err, data) => {
			if (err) rej(err);
			else res(data);
		})
	})
}

module.exports.concatAndReencode = function (videoPaths, outPath) {
	let start = Date.now()
	return new Promise((res, rej) => {
		getConcat(videoPaths)
			.videoCodec('libx264')
			.audioCodec('aac')
			.on('end', () => {
				res()
				console.log("concatAndReencode took %s", Date.now() - start)
			})
			.on('error', console.error)
			.mergeToFile(outPath, tempFolder)
	})
}

module.exports.combineImageAudio = function (imagePath, audioPath, outPath) {
	return new Promise(async (res, rej) => {
		let audioInfo = await probe(audioPath)
		let afterProbe = Date.now()
		ffmpeg(imagePath)
			.inputOptions([
				'-stream_loop 1',
			])
			.videoCodec('libx264')
			.fpsOutput(25)
			.duration(audioInfo.format.duration + 0.15)
			.input(audioPath)
			.audioCodec('aac')
			.audioFrequency(24000)
			.outputOptions([
                '-pix_fmt yuv420p',
			])
			.output(outPath)
			.on('end', () => {
				res()
				console.log("combineImageAudio took %s", Date.now() - afterProbe)
			})
			.on('error', console.error)
			.exec()
	})
}

module.exports.combineVideoAudio = function (videoPath, audioPath, outPath) {
	let start = Date.now()
	return new Promise((res, rej) => {
		ffmpeg(videoPath)
			.inputFormat(inputFormat)
			.videoCodec('libx264')
			.input(audioPath)
			.audioCodec('aac')
			.complexFilter([ '[0:a][1:a] amerge=inputs=2 [a]' ])
			.fpsOutput(25)
			.outputOptions([
				'-shortest',
				'-map 0:v',
				'-map [a]',
			])
			.audioChannels(1)
			.output(outPath)
			.on('end', () => {
				res()

				console.log("combineVideoAudio took %s", Date.now() - start)
			})
			.on('error', console.error)
			.exec()
	})
}

module.exports.simpleConcat = function (videoPaths, outPath) {
	let start = Date.now()
	return new Promise((res, rej) => {
		getConcat(videoPaths)
			.videoCodec('copy')
			.audioCodec('copy')
			.on('end', () => {
				res()

				console.log("simpleConcat took %s", Date.now() - start)
			})
			.on('error', console.error)
			.save(outPath)
	})
}

module.exports.padAndConcat = function (videoPaths, outPath) {
	let start = Date.now()
	return new Promise((res, rej) => {
		getConcat(videoPaths)
			.videoCodec('copy')
			.audioCodec('copy')
			.on('end', () => {
				res()

				console.log("padAndConcat took %s", Date.now() - start)
			})
			.on('error', console.error)
			.save(outPath)
	})
}