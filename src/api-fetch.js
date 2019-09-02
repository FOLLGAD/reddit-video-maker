const timeAgo = require('node-time-ago')
const cheerio = require('cheerio')
const { synthSpeech } = require('./synth')
const { launchPuppet, commentTemplate } = require('./puppet')
const { combineImageAudio, padAndConcat } = require('./video')
const { sanitizeHtml, sanitizeUsername, sanitizeSynth } = require('./sanitize')
const { splitQuestion, compileHtml, formatPoints } = require('./utils')
const tmp = require('tmp')

// Takes in a html element
// Edits $ in the code, and returns an array of all tts segments
function compileQuestion($) {
	let id = 0,
		tts = []

	let handle = function (arr, contents) {
		let lastWasTag = false
		// Splits string on punctuation
		for (let i = 0; i < contents.length; i++) {
			let h = contents[i]
			if (h.type == 'text') {
				let data = splitQuestion(h.data)
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
	}

	$('.text').each((_, e) => {
		let arr = [],
			contents = $(e).contents()

		handle(arr, contents)

		tts.push(...arr)
		tts = tts.map(sanitizeSynth) // Sanitize the Question title
		let html = arr
			.map(d => `<span id="${id++}" class="hide">${d}</span>`)
			.map(sanitizeHtml)
			.join('')

		$(e).html(html)
	})

	return tts
}

function hydrate(comment, upvoteProb = 0.1) {
	comment.score = formatPoints(comment.score)
	comment.created = timeAgo(comment.created_utc * 1000)
	if (comment.edited) {
		comment.edited = timeAgo(comment.edited * 1000)
	}
	if (comment.num_comments) {
		comment.num_comments = formatPoints(comment.num_comments)
	}
	if (comment.replies) {
		comment.replies = comment.replies.map(hydrate)
	}
	comment.all_awardings = comment.all_awardings.map(d => ({
		is_enabled: d.is_enabled,
		count: d.count,
		icon_url: d.resized_icons[1].url, // Pick the 32x32 image
	}))
	comment.showBottom = true
	comment.upvoted = Math.random() < upvoteProb // Some of the posts will randomly be seen as upvoted
	comment.authorHtml = sanitizeUsername(comment.author)

	return comment
}
module.exports.hydrate = hydrate

async function sequentialWork(works, options) {
	let arr = []
	for (let i = 0; i < works.length; i++) {
		let obj = works[i]
		let imgPromise = launchPuppet(obj.type, obj.imgObj)
		let audioPromise = synthSpeech(obj.tts, options.theme.ttsEngine)
		try {
			let [imgPath, audioPath] = await Promise.all([imgPromise, audioPromise])
			let file = tmp.fileSync({ postfix: '.mkv' })
			let path = file.name
			await combineImageAudio(imgPath, audioPath, path)
			arr.push(path)
		} catch (e) {
			// Do nothing, skips frame
			console.log("Failed frame")
			console.error(e)
		}
	}
	if (arr.length === 0) {
		// Skip this shit
		throw new Error("Comment render: No segments succeeded.")
	}
	return arr
}

// Should return the name of video of the created comment
module.exports.renderComment = async function renderComment(commentData, name, options) {
	let rootComment = hydrate(commentData, 0.1)
	let tts = compileHtml(rootComment, options)
	let workLine = []
	let markup = commentTemplate(rootComment)
	let $ = cheerio.load(markup)

	$('span.hide').each((i, _) => {
		let curr = $('.hide#' + i)

		curr.removeClass('hide')
		curr.parents('.hide-until-active').removeClass('hide-until-active') // Activate parent elements

		let hiddenRemaining = curr.closest('.DIV_28').find('span.hide').length
		if (hiddenRemaining === 0) {
			curr.closest('.DIV_28').siblings('.DIV_31').removeClass('hide-until-active')
		}

		// Save a snapshot of the html where the current element has class .center-elem
		curr.addClass('center-elem')
		let html = $.html()
		curr.removeClass('center-elem')

		let text
		try {
			text = cheerio.load(tts[i]).text()
		} catch(e) {
			console.log(tts)
			console.log($('span.hide').length)
			console.log(i)
			throw e
		}

		let obj = {
			imgObj: html,
			tts: text,
			type: 'comment',
		}

		workLine.push(obj)
	})

	return await sequentialWork(workLine, options)
		.then(async videos => {
			let file = tmp.fileSync({ postfix: '.mkv' })
			let path = file.name
			await padAndConcat(videos.filter(v => v != null), path)
			return path
		})
}

module.exports.renderQuestion = function renderQuestion(questionData, options) {
	let hydrated = hydrate(questionData, 0.5)

	let $ = cheerio.load(hydrated.title)
	let text = $.text()

	$ = cheerio.load('<span class="text">' + text + '</span>')

	let tts = compileQuestion($)

	let workLine = []
	let name = 'Q'

	$('span.hide').each((i, _) => {
		$('.hide#' + i).removeClass('hide')
		let toRender = $.html()

		let obj = {
			name: name + '-' + i,
			imgObj: { ...hydrated, body_html: toRender },
			tts: cheerio.load(tts[i]).text(),
			type: 'question',
		}

		workLine.push(obj)
	})

	return sequentialWork(workLine, options)
		.then(async videos => {
			let file = tmp.fileSync({ postfix: '.mkv' })
			let path = file.name
			await padAndConcat(videos.filter(v => v != null), path)
			return path
		})
}
