let { renderComment, renderQuestion } = require('./api-fetch')
let { combineVideoAudio, concatAndReencode, simpleConcat } = require('./video')

let transition = '../static/transition_dark.mkv'
let outro = '../static/outro_dark.mkv'

// Input: thread; array of comment ID:s
// Put transitions after every comment and add song.
// add question & outro

module.exports.render = async function (questionData, commentData, song) {
	console.log('Started rendering')
	let start = Date.now()
	let videolist = []

	console.log('Rendering', commentData.length, commentData.length === 1 ? 'comment' : 'comments')
	for (let i = 0; i < commentData.length; i++) {
		try {
			let commentFile = await renderComment(commentData[i], i)
			videolist.push('../video-output/' + commentFile)
			videolist.push(transition)
			console.log("Successfully rendered comment", i)
		} catch (e) {
			console.error(e)
			console.log("Comment number", i, "failed to render. It will not be added.")
		}
	}

	try {
		console.log("Adding transitions...")
		let nosoundFile = '../video-output/no-sound.mkv'
		await simpleConcat(videolist, nosoundFile)

		console.log("Adding sound...")
		let soundFile = '../video-output/with-sound.mkv'
		await combineVideoAudio(nosoundFile, '../static/' + song, soundFile)

		console.log("Rendering question...")
		let question = await renderQuestion(questionData)

		console.log("Rendering final...")
		await concatAndReencode([question, soundFile, outro], '../video-output/final.mkv')
		console.log("Finished render in", (Date.now() - start) / 1000 + "s")
	} catch (e) {
		console.error("Rendering failed")
		console.error(e)
	}
}