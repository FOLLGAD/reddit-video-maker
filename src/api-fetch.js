const timeAgo = require('node-time-ago')
const fs = require('fs')
const cheerio = require('cheerio')
const { synthDaniel, foulSpanDictionary } = require('./synth')
const { launch } = require('./puppet')
const { audioVideoCombine, combineVideos, copyVideo } = require('./video')
const { fetchThread, updateAuth } = require('./reddit-api')

process.setMaxListeners(20)

let arr = [
	'../static',
	'../audio-output',
	'../for-compilation',
	'../images',
	'../video-output',
	'../video-temp',
	'../videolists',
	'../out',
]
arr.forEach(pth => {
	if (!fs.existsSync(pth)) {
		fs.mkdirSync(pth)
	}
})

let sanitizeHtml = str => {
	for (key in foulSpanDictionary) {
		str = str.replace(new RegExp(key, 'gi'), foulSpanDictionary[key])
	}
	return str
}

function splitString(str) {
	return str
		.split(/<br>|(.+?[\.,?!]+["'\)\s]+)/g)
		.filter(d => d.replace('\u200B', ' ').trim().length > 0)
}

// Takes in a html element
// Edits $ in the code, and returns an array of all tts segments
function compileHtml($) {
	$('p').addClass('text')

	// Removes .text class from all <p> with <li> children
	$('p li').parent('p').removeClass('text')

	let id = 0,
		tts = []
	$('p.text,li').each((_, e) => {
		let lastWasTag = false

		let arr = [],
			contents = $(e).contents()

		// Splits string on punctuation
		for (let i = 0; i < contents.length; i++) {
			let h = contents[i]
			if (h.type == 'text') {
				let data = splitString(h.data)
				if (lastWasTag) {
					arr[arr.length - 1] += data.shift()
				}
				lastWasTag = false

				arr.push(...data)
			} else if (h.name == 'br') {
				arr[arr.length - 1] += "<br>"
			} else {
				// It's a tag
				lastWasTag = true
				let text = cheerio.load(h).html()
				if (text.indexOf('.') !== -1) lastWasTag = false
				arr[arr.length - 1] += text
			}
		}

		tts.push(...arr)
		let html = arr.map(d => `<span id="${id++}" class="hide">${d}</span>`).map(sanitizeHtml).join('')

		$(e).html(html)
	})

	return tts
}

async function renderCommentImgs(commentData, name) {
	let items = {
		upvoted: Math.random() > 0.9, // ~10% of the posts will randomly be seen as upvoted
		score: formatNum(commentData.score),
		username: commentData.author,
		time: timeAgo(commentData.created_utc * 1000), // Timezones are unimportant
		edited: commentData.edited ? timeAgo(commentData.edited * 1000) : null,
		silvers: commentData.gildings.gid_1,
		golds: commentData.gildings.gid_2,
		platina: commentData.gildings.gid_3,
		body: commentData.body_html,
	}

	let $ = cheerio.load(items.body)

	let tts = compileHtml($)

	let workLine = []
	let ln = $('span.hide').length

	$('span.hide').each((i, _) => {
		$('.hide#' + i).removeClass('hide')
		let toRender = $.html()

		let obj = {
			name: name + '-' + i,
			imgObj: { ...items, body_html: toRender, showBottom: i == ln - 1 },
			tts: cheerio.load(tts[i]).text(),
			type: 'comment',
		}

		workLine.push(obj)
	})

	await sequentialWork(workLine)
		.then(videos => {
			combineVideos(videos.filter(v => v != null), name)
		})
}

async function sequentialWork(works) {
	let arr = []
	for (let i = 0; i < works.length; i++) {
		let obj = works[i]
		let imgPromise = launch(obj.name, obj.type, obj.imgObj)
		let audioPromise = synthDaniel(obj.name + '.mp3', obj.tts)
		try {
			let [img, audio] = await Promise.all([imgPromise, audioPromise])
			let result = await audioVideoCombine(obj.name, audio, img)
			arr.push(result)
		} catch (e) {
			// Do nothing, skips frame
		}
	}
	return arr
}

function renderQuestion(questionData) {
	let items = {
		username: questionData.author,
		score: formatNum(questionData.score),
		time: timeAgo(questionData.created_utc * 1000), // Timezones are unimportant
		comments: formatNum(questionData.num_comments),

		body_html: questionData.title,

		silvers: questionData.gildings.gid_1,
		golds: questionData.gildings.gid_2,
		platina: questionData.gildings.gid_3,
	}

	let array = splitString(sanitizeHtml(items.body_html))

	let workLine = []

	for (let i = 0; i < array.length; i++) {
		let counter = 0
		let tts = ""

		let formattedText = array.map(str => {
			if (counter == i) {
				tts = str
			}
			if (counter++ > i) {
				return hideSpan(str)
			}
			return str
		})

		let obj = {
			name: 'Q-' + i,
			imgObj: { ...items, body_html: formattedText.join("") },
			tts: tts,
			type: 'question',
		}

		workLine.push(obj)
	}

	return sequentialWork(workLine)
		.then(videos => combineVideos(videos, 'Q'))
		.then(() => {
			copyVideo('../video-output/Q.mkv', '../Q.mp4')
		})
}

function hideSpan(str) {
	return '<span class="invis">' + str + '</span>'
}

function formatNum(num) {
	let d = parseInt(num)
	if (num >= 1000) {
		return Math.round(num / 100) / 10 + 'k'
	}
	return d
}

function getOptions(optionsArray) {
	optsArray = optionsArray.slice()

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

	let question, commentData

	if (!thread) {
		throw new Error("Must enter a thread ID")
	} else if (thread == "test") {
		[question, commentData] = require('./testData')
	} else {
		[question, commentData] = await fetchThread(thread, options)
	}

	let maxchars = 1250

	let comments = commentData.filter(d => d.body.length < maxchars && d.body != '[deleted]' && d.body != '[removed]').slice(options.start)

	if (options.filterEdits) {
		let reg = /^edit/im
		comments = comments.filter(d => {
			return !reg.test(d.body)
		})
	}
	console.log('Comments fetched:', comments.length)

	if (!options.skipQuestion) {
		await renderQuestion(question)
		console.log("Rendered", "Q")
	}

	for (let i = 0; i < comments.length; i++) {
		await renderCommentImgs(comments[i], i + options.start)
		console.log("Rendered", i + options.start)
	}

	console.log("Finished!")
}

main()