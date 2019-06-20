let { renderComment, renderQuestion } = require('./api-fetch')
let { addSound, concatFromVideolist } = require('./video')
let fs = require('fs')

let transition = '../static/transition_dark.mkv'
let outro = '../static/outro_dark.mkv'

// Input: thread; array of comment ID:s
// Put transitions after every comment and add song.
// add question & outro
/*
commentData format:
[
	{
		data: *comment*,
		children: *child comments, if any*
	}
]
*/

module.exports.render = async function render(questionData, commentData, song) {
	console.log('Started rendering')
	let start = Date.now()
	let videolist = []

	for (let i = 0; i < commentData.length; i++) {
		try {
			let commentFile = await renderComment(commentData[i], i)
			videolist.push('../video-output/' + commentFile)
			videolist.push(transition)
			console.log("Successfully rendered comment", i)
		} catch (e) {
			console.log("Comment number", i, "failed to render. It will not be added.")
		}
	}

	videolist = videolist
		// .map(pt => path.join(__dirname, pt))
		.map(pt => `file '${pt}'`)
		.join('\n')

	fs.writeFileSync('../videolists/all.txt', videolist)

	try {
		console.log("Adding transitions...")
		let nosoundFile = await concatFromVideolist('all.txt', '../video-output/nosound.mkv')
		console.log("Adding sound...")
		let soundFile = await addSound('../video-output/' + nosoundFile, '../static/' + song, 'withsound', 'mkv')
		console.log("Rendering question...")
		let question = await renderQuestion(questionData, false)

		videolist = [question, soundFile, outro]
			.map(pt => `file '${pt}'`)
			.join('\n')

		fs.writeFileSync('../videolists/all.txt', videolist)

		let final = await concatFromVideolist('all.txt', '../video-output/final.mkv')
		console.log("Finished render in", (Date.now() - start) / 1000 + "s")
	} catch (e) {
		console.error("Rendering failed")
		console.error(e)
	}
}