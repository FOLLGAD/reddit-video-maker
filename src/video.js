// This file contains all the ffmpeg-mappings
// The library fluent-ffmpeg is used as a wrapper for all calls to ffmpeg

const ffmpeg = require('fluent-ffmpeg'),
	tmp = require('tmp')

tmp.setGracefulCleanup() // Enforce graceful file cleanup

let color = '#19191a' // Dark mode
// let color = '#ffffff' // Light mode

// ffmpeg -i transition_new_dark.mp4 -c:a aac -c:v libx264 -r 25 -ac 2 -ar 24000 transition_dark.mkv

let intermediaryFileFormat = 'mkv'
let inputFormat = 'matroska'

let tempFolderInfo = tmp.dirSync()
let tempFolder = tempFolderInfo.name

function getConcat(videoPaths) {
	// ffmpeg(`concat:${videoPaths.join('|')}`)
	let f = ffmpeg()
	videoPaths.forEach(v =>
		f.input(v)
			.inputFormat(inputFormat)
	)
	// f.mergeToFile(outPath, tempFolder)
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
				'-loop 1',
			])
			.videoCodec('copy')
			// .videoFilters([
			// 	`pad=1920:1080:(ow-iw)/2:(oh-ih)/2:${color}`
			// ])
			.fpsOutput(25)
			.outputOptions([
				'-shortest',
			])
			.input(audioPath)
			.duration(audioInfo.format.duration + 0.15)
			.audioCodec('copy')
			// .size('1920x1080')
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
			.videoCodec('copy')
			.input(audioPath)
			.audioCodec('aac')
			.complexFilter([
				'[0:a][1:a]amerge=inputs=2[a]',
			])
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
			.videoCodec('libx264')
			.audioCodec('aac')
			.on('end', () => {
				res()

				console.log("simpleConcat took %s", Date.now() - start)
			})
			.on('error', console.error)
			.mergeToFile(outPath, tempFolder)
	})
}

module.exports.padAndConcat = function (videoPaths, outPath) {
	let start = Date.now()
	return new Promise((res, rej) => {
		getConcat(videoPaths)
			.videoCodec('libx264')
			.audioCodec('aac')
			.on('end', () => {
				res()

				console.log("simpleConcat took %s", Date.now() - start)
			})
			.on('error', console.error)
			.mergeToFile(outPath, tempFolder)
	})
}