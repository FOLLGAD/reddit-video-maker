const { fetchThread, updateAuth } = require('./reddit-api')
const { renderComment, renderQuestion } = require('./api-fetch')

function getOptions(optionsArray) {
	let optsArray = optionsArray.slice()

	let opts = {
		filterEdits: false,
		skipQuestion: false,
		start: 0,
		end: 100,
		sortBy: 'best',
	}

	let editsInd = optionsArray.indexOf('-x')
	if (editsInd != -1) {
		opts.filterEdits = true
		optsArray.splice(editsInd, 1)
	}

	let skipQueInd = optionsArray.indexOf('-sq')
	if (skipQueInd != -1) {
		opts.skipQuestion = true
	}

	let startInd = optionsArray.indexOf('-start')
	if (startInd != -1) {
		opts.start = Number(optionsArray[startInd + 1])
		optsArray.splice(startInd, 2)
	}

	let endInd = optionsArray.indexOf('-end')
	if (endInd != -1) {
		opts.end = Number(optionsArray[endInd + 1])
		optsArray.splice(endInd, 2)
	}

	let sortInd = optionsArray.indexOf('-sort')
	if (sortInd != -1) {
		opts.sortBy = optionsArray[sortInd + 1]
		optsArray.splice(sortInd, 2)
	}

	opts.thread = optsArray[0]

	return opts
}

async function main() {
	console.log("Started BOG")
	await updateAuth()
	console.log("AUTH completed")

	let options = getOptions(process.argv.slice(2))

	let thread = process.argv[2]
	thread = thread.trim()
	console.log("Fetching from thread", thread)

	let questionData, commentData

	if (!thread) {
		throw new Error("Must enter a thread ID")
	} else if (thread == "test") {
		[questionData, commentData] = require('./testData')
	} else {
		let data = await fetchThread(thread, options)
		questionData = data.questionData
		commentData = data.commentData
	}

	let maxchars = 1600

	let comments = commentData
		.filter(d => d.body_html.length < maxchars && d.body_html != '[deleted]' && d.body_html != '[removed]')
		.slice(options.start)
		.map(comment => {
			comment.replies = []
			return comment
		})

	if (options.filterEdits) {
		let reg = /^edit/im
		comments = comments.filter(d => {
			return !reg.test(d.body)
		})
	}
	console.log('Comments fetched:', comments.length)

	if (!options.skipQuestion) {
		await renderQuestion(questionData)
		console.log("Rendered", "Q")
	}

	for (let i = 0; i < comments.length; i++) {
		await renderComment(comments[i], i + options.start)
		console.log("Rendered", i + options.start)
	}

	console.log("Finished!")
}

main()