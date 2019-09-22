let { renderComment, renderQuestion } = require('./construct-html')
let { combineVideoAudio, simpleConcat } = require('./video')
let {fetchAboutSubreddit} = require('./reddit-api')
let tmp = require('tmp')

async function renderFromComments(question, videolist, inputPath, {
	intro,
	outro,
	song,
}) {
	console.log("Adding transitions...")
	let nosoundFile = tmp.fileSync({ postfix: '.mkv', prefix: 'transitions-' })
	await simpleConcat(videolist, nosoundFile.name)

	let soundFile

	if (song) {
		console.log("Adding sound...")
		soundFile = tmp.fileSync({ postfix: '.mkv' })
		await combineVideoAudio(nosoundFile.name, song, soundFile.name)
	} else {
		console.log("No song selected")
		soundFile = nosoundFile
	}

	let queue = [question, soundFile.name]
	if (outro) queue.push(outro)
	if (intro) queue.unshift(intro) // Insert as first element

	await simpleConcat(queue, inputPath)
}

function addTransitions(videolist, transitionPath) {
	let arr = []
	videolist.forEach(video => {
		arr.push(video, transitionPath)
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
				voice: options.voice
			})
			videolist.push(commentPath)
			console.log("Successfully rendered comment", i)
		} catch (e) {
			console.error(e)
			console.log("Comment number", i, "failed to render. It will not be added.")
		}
	}

	const withTransitions = options.transition ?
		addTransitions(videolist, options.transition) :
		videolist

	try {
		console.log("Rendering question...")
		let question = await renderQuestion({ questionData, voice: options.voice })

		await renderFromComments(question, withTransitions, options.outPath, {
			outro: options.outro,
			intro: options.intro,
			song: options.song,
		})
		console.log("Finished render in", (Date.now() - start) / 1000 + "s")
	} catch (e) {
		console.error(e)
		console.error("Rendering failed")
	}
}