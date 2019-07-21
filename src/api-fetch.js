const timeAgo = require('node-time-ago')
const cheerio = require('cheerio')
const { synthSpeech } = require('./synth')
const { launch, commentTemplate } = require('./puppet')
const { advancedConcat, combineImageAudio, padAndConcat } = require('./video')
const { sanitizeHtml, sanitizeUsername } = require('./sanitize')
const { splitComment, splitQuestion } = require('./split')

let fileExt = 'mkv'

let compileHtml = function (rootComment, options) {
	let id = 0
	let rec = commentTree => {
		let $ = cheerio.load(commentTree.body_html)

		$('p,li,blockquote').addClass('text')
		$('li,blockquote').addClass('hide-until-active') // To hide the list dots until they're needed

		// Removes .text class from all <p> with <li> children
		$('p li').parent('p').removeClass('text')
		$('p,li,blockquote').parents('p,li,blockquote').removeClass('text')

		if (!options.keepLinks) {
			// Remove links
			$('.text a').each(function () {
				$(this).contents().insertAfter($(this))
				$(this).remove()
			})
		}

		let tts = []

		let handle = function (arr, contents) {
			let lastWasTag = false
			// Splits string on punctuation
			for (let i = 0; i < contents.length; i++) {
				let h = contents[i]
				if (h.type == 'text') {
					let data = splitComment(h.data)
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
					let $$ = cheerio.load(h)
					let html = $$.html()
					if ($$.text().indexOf('.') !== -1) lastWasTag = false
					if (arr.length > 0) {
						arr[arr.length - 1] += html
					} else {
						arr[0] = html
					}
				}
			}
		}

		$('.text').each((_, e) => {
			let arr = [],
				contents = $(e).contents()

			handle(arr, contents)

			tts.push(...arr)
			let html = arr
				.map(d => `<span id="${id++}" class="hide">${d}</span>`)
				.map(sanitizeHtml)
				.join('')

			$(e).html(html)
		})

		commentTree.body_html = $.html()

		if (Array.isArray(commentTree.replies)) {
			commentTree.replies.forEach(reply => {
				tts = tts.concat(rec(reply))
			})
		}

		return tts
	}
	return rec(rootComment)
}

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
		let html = arr
			.map(d => `<span id="${id++}" class="hide">${d}</span>`)
			.map(sanitizeHtml)
			.join('')

		$(e).html(html)
	})

	return tts
}

function hydrate(comment, upvoteProb = 0.1) {
	comment.score = formatNum(comment.score)
	comment.created = timeAgo(comment.created_utc * 1000)
	if (comment.edited) {
		comment.edited = timeAgo(comment.edited * 1000)
	}
	if (comment.num_comments) {
		comment.num_comments = formatNum(comment.num_comments)
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

async function sequentialWork(works) {
	let arr = []
	for (let i = 0; i < works.length; i++) {
		let obj = works[i]
		let imgPromise = launch(obj.name, obj.type, obj.imgObj)
		let audioPromise = synthSpeech(obj.name + '.aiff', obj.tts)
		try {
			let [img, audio] = await Promise.all([imgPromise, audioPromise])
			let path = `../video-temp/${obj.name}.${fileExt}`
			await combineImageAudio('../images/' + img, '../audio-output/' + audio, path)
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

		let html = $.html()

		let obj = {
			name: name + '-' + i,
			imgObj: html,
			tts: cheerio.load(tts[i]).text(),
			type: 'comment',
		}

		workLine.push(obj)
	})

	return await sequentialWork(workLine)
		.then(async videos => {
			let path = `../video-output/${name}.${fileExt}`
			await advancedConcat(videos.filter(v => v != null), path)
			return path
		})
}

module.exports.renderQuestion = function renderQuestion(questionData) {
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

	return sequentialWork(workLine)
		.then(async videos => {
			let path = `../video-output/${name}.${fileExt}`
			await padAndConcat(videos.filter(v => v != null), path)
			return path
		})
}

function formatNum(num) {
	let d = parseInt(num)
	if (num >= 1000) {
		return Math.round(num / 100) / 10 + 'k'
	}
	return d
}