let { renderComment, renderQuestion } = require('./construct-html')
let { combineVideoAudio, simpleConcat, probe } = require('./video')
let tmp = require('tmp')

const vidExtension = 'mp4'

async function renderFromComments(question, videolist, inputPath, {
	intro,
	outro,
	song,
}) {
	let dir = tmp.dirSync({ unsafeCleanup: true })
	console.log("Adding transitions...")
	let noSongFile = tmp.fileSync({ dir: dir.name, postfix: '.' + vidExtension, prefix: 'transitions-' })
	await simpleConcat(videolist, noSongFile.name)

	let withSongFile

	let songVolDuringComments = 0.5

	if (song) {
		// Add song to comments at a lowered volume
		console.log("Adding sound...")
		withSongFile = tmp.fileSync({ dir: dir.name, postfix: '.' + vidExtension })
		await combineVideoAudio(noSongFile.name, song, withSongFile.name, songVolDuringComments)
	} else {
		// Don't add song to file
		console.log("No song selected")
		withSongFile = noSongFile
	}

	let queue = [question, withSongFile.name]
	if (outro) {
		let commentsProbe = await probe(withSongFile.name)
		let commentsDuration = parseFloat(commentsProbe.format.duration)
		let outroWithSong = tmp.fileSync({ tmpdir: dir.name, postfix: "." + vidExtension, prefix: "outro-" })

		await combineVideoAudio(outro, song, outroWithSong.name, 1.00, commentsDuration)

		queue.push(outroWithSong.name)
	}
	if (intro) queue.unshift(intro) // Insert as first element

	await simpleConcat(queue, inputPath)
	dir.removeCallback()
}

async function renderQuestionOnly(question, outPath, {
	intro,
	outro,
	song,
}) {
	let soundFile

	let queue = []
	// Add song to question file
	if (song) {
		console.log("Adding sound...")
		soundFile = tmp.fileSync({ postfix: '.' + vidExtension, prefix: "soundfile-" })
		await combineVideoAudio(question, song, soundFile)
		queue.push(soundFile)
	} else {
		console.log("No song selected")
		queue.push(question)
	}

	if (intro) queue.unshift(intro) // Insert intro at first pos
	if (outro) queue.push(outro)

	await simpleConcat(queue, outPath)

	if (soundFile) soundFile.removeCallback()
}

function insertTransitions(videolist, transitionPath) {
	let arr = []
	videolist.forEach((video, i, a) => {
		arr.push(video)
		if (i !== a.length - 1) {
			arr.push(transitionPath)
		}
	})

	return arr
}

module.exports.render = async function (questionData, commentData, options) {
	console.log('Started rendering')
	let start = Date.now()
	let videolist = []

	console.log('Rendering', commentData.length, commentData.length === 1 ? 'comment' : 'comments')
	for (let i = 0; i < commentData.length; i++) {
		try {
			let commentPath = await renderComment({
				commentData: commentData[i],
				voice: options.voice,
				commentIndex: i,
				callToAction: options.callToAction,
			})
			videolist.push(commentPath)
			console.log("Successfully rendered comment", i)
		} catch (e) {
			console.error(e)
			console.log("Comment number", i, "failed to render. It will not be added.")
		}
	}

	const withTransitions = options.transition ?
		insertTransitions(videolist, options.transition) :
		videolist

	try {
		console.log("Rendering question...")
		let question = await renderQuestion({ questionData, voice: options.voice })

		console.log("Concatting...")

		let vidOptions = {
			outro: options.outro,
			intro: options.intro,
			song: options.song,
		}

		if (commentData.length > 0) {
			await renderFromComments(question, withTransitions, options.outPath, vidOptions)
		} else {
			await renderQuestionOnly(question, options.outPath, vidOptions)
		}
		console.log("Finished render in", (Date.now() - start) / 1000 + "s")
	} catch (e) {
		console.error(e)
		throw new Error("Rendering failed")
	}
}
