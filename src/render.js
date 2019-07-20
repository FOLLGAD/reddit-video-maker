let { renderComment, renderQuestion } = require('./api-fetch')
let { combineVideoAudio, concatAndReencode, simpleConcat } = require('./video')
let path = require('path')

// Input: thread; array of comment ID:s
// Put transitions after every comment and add song.
// add question & outro

const defaultOptions = {
	keepLinks: false,
}

async function renderFromComments(question, videolist, options) {
	let outroPath = path.join('../themes', options.theme, 'outro.mkv')
	let songPath = path.join('../themes', options.theme, options.song)

	console.log("Adding transitions...")
	let nosoundFile = '../video-output/no-sound.mkv'
	await simpleConcat(videolist, nosoundFile)

	console.log("Adding sound...")
	let soundFile = '../video-output/with-sound.mkv'
	await combineVideoAudio(nosoundFile, songPath, soundFile)

	console.log("Rendering final...")
	await concatAndReencode([question, soundFile, outroPath], '../video-output/final.mkv')
}
module.exports.renderFromComments = renderFromComments

function addTransitions(videolist, options) {
	let transitionPath = path.join('../themes', options.theme, 'transition.mkv')

	let arr = []
	videolist.forEach(video => {
		arr.push(video, transitionPath)
	})

	return arr
}
module.exports.addTransitions = addTransitions

class Tailinator {
	constructor() {
		this.tail = Promise.resolve()
	}
	add(func) {
		this.tail = this.tail.then(func)
	}
}

module.exports.render = async function (questionData, commentData, options = defaultOptions) {
	console.log('Started rendering')
	let start = Date.now()
	let videolist = []

	let tailinator = new Tailinator()

	console.log('Rendering', commentData.length, commentData.length === 1 ? 'comment' : 'comments')
	for (let i = 0; i < commentData.length; i++) {
		try {
			let commentFile = await renderComment(commentData[i], i, options, tailinator)
			videolist.push('../video-output/' + commentFile)
			console.log("Successfully rendered comment", i)
		} catch (e) {
			console.error(e)
			console.log("Comment number", i, "failed to render. It will not be added.")
		}
	}

	await tailinator.tail

	videolist = addTransitions(videolist, options)

	try {
		console.log("Rendering question...")
		let question = await renderQuestion(questionData)

		await renderFromComments(question, videolist, options)
		console.log("Finished render in", (Date.now() - start) / 1000 + "s")
	} catch (e) {
		console.error(e)
		console.error("Rendering failed")
	}
}