let { renderComment, renderQuestion } = require('./construct-html')
let { combineVideoAudio, concatAndReencode, simpleConcat } = require('./video')
let path = require('path')
let tmp = require('tmp')

async function renderFromComments(question, videolist, options, inputPath) {
	let outroPath = path.join(__dirname, '../themes', options.theme.name, 'outro.mkv')
	let songPath = path.join(__dirname, '../themes', options.theme.name, options.song)

	console.log("Adding transitions...")
	let nosoundFile = tmp.fileSync({ postfix: '.mkv' })
	await simpleConcat(videolist, nosoundFile.name)

	console.log("Adding sound...")
	let soundFile = tmp.fileSync({ postfix: '.mkv' })
	await combineVideoAudio(nosoundFile.name, songPath, soundFile.name)

	console.log("Rendering final...")
	await concatAndReencode([question, soundFile.name, outroPath], inputPath)
}
module.exports.renderFromComments = renderFromComments

function addTransitions(videolist, options) {
	let transitionPath = path.join(__dirname, '../themes', options.theme.name, 'transition.mkv')

	let arr = []
	videolist.forEach(video => {
		arr.push(video, transitionPath)
	})

	return arr
}
module.exports.addTransitions = addTransitions

module.exports.render = async function (questionData, commentData, options) {
	console.log('Started rendering')
	let start = Date.now()
	let videolist = []

	console.log('Rendering', commentData.length, commentData.length === 1 ? 'comment' : 'comments')
	for (let i = 0; i < commentData.length; i++) {
		try {
			let commentPath = await renderComment(commentData[i], options)
			videolist.push(commentPath)
			console.log("Successfully rendered comment", i)
		} catch (e) {
			console.error(e)
			console.log("Comment number", i, "failed to render. It will not be added.")
		}
	}

	const withTransitions = addTransitions(videolist, options)

	try {
		console.log("Rendering question...")
		let question = await renderQuestion(questionData, options)

		let outputPath = options.outPath

		await renderFromComments(question, withTransitions, options, outputPath)
		console.log("Finished render in", (Date.now() - start) / 1000 + "s")
	} catch (e) {
		console.error(e)
		console.error("Rendering failed")
	}
}