let { renderComment, renderQuestion } = require('./api-fetch')
let { addSound, concatFromVideolist } = require('./video')
let fs = require('fs')

let transition = '../static/transition.mkv'
let outro = '../static/outro.mkv'

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
	let start = Date.now()
	let videolist = []

	for (let i = 0; i < commentData.length; i++) {
		try {
			let commentFile = await renderComment(commentData[i], i)
			videolist.push('../video-output/' + commentFile)
			videolist.push(transition)
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
		let nosoundFile = await concatFromVideolist('all.txt', '../video-output/nosound.mkv')
		let soundFile = await addSound('../video-output/' + nosoundFile, '../static/' + song, 'withsound', 'mkv')
		let question = await renderQuestion(questionData)

		videolist = [question, soundFile, outro]
			.map(pt => `file '${pt}'`)
			.join('\n')

		fs.writeFileSync('../videolists/all.txt', videolist)

		let final = await concatFromVideolist('all.txt', '../video-output/final.mkv')
	} catch (e) {
		console.error(e)
	}

	console.log("Finished render in", Date.now() - start + "ms")
}