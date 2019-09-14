let { renderComment, renderQuestion } = require('./construct-html')
let { combineVideoAudio, simpleConcat } = require('./video')
let path = require('path')
let tmp = require('tmp')

async function renderFromComments(question, videolist, options, inputPath) {
	let outroPath = path.join(__dirname, '../themes', options.theme.name, 'outro.mkv')
	let songPath = path.join(__dirname, '../themes', options.theme.name, options.song)

	console.log("Adding transitions...")
	let nosoundFile = tmp.fileSync({ postfix: '.mkv', prefix: 'transitions-' })
	let videosWithTransitions = addTransitions(videolist, options)
	await simpleConcat(videosWithTransitions, nosoundFile.name)

	console.log("Adding sound...")
	let soundFile = tmp.fileSync({ postfix: '.mkv', prefix: 'sound-' })
	await combineVideoAudio(nosoundFile.name, songPath, soundFile.name)

	console.log("Rendering final...")
	await simpleConcat([question, soundFile.name, outroPath], inputPath)
}

// Insert transitions between all elements
function addTransitions(videolist, options) {
	let transitionPath = path.join(__dirname, '../themes', options.theme.name, 'transition.mkv')

	let arr = []
	videolist.forEach(video => {
		arr.push(video, transitionPath)
	})

	return arr
}

const defaultOptions = {
	keepLinks: false,
}

module.exports.render = async function (questionData, commentData, options = defaultOptions) {
	console.log('Started rendering')
	let start = Date.now()
	let videolist = []

	console.log('Rendering', commentData.length, commentData.length === 1 ? 'comment' : 'comments')
	for (let i = 0; i < commentData.length; i++) {
		try {
			let commentPath = await renderComment(commentData[i], i, options)
			videolist.push(commentPath)
			console.log("Successfully rendered comment", i)
		} catch (e) {
			console.error(e)
			console.log("Comment number", i, "failed to render. It will not be added.")
		}
	}

	try {
		console.log("Rendering question...")
		let question = await renderQuestion(questionData, options)

		let outputPath = options.outPath

		await renderFromComments(question, videolist, options, outputPath)
		console.log("Finished render in", (Date.now() - start) / 1000 + "s")
	} catch (e) {
		console.error(e)
		console.error("Rendering failed")
	}
}