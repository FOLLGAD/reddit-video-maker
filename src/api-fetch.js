const timeAgo = require('node-time-ago')
const cheerio = require('cheerio')
const { synthDaniel, foulSpanArray } = require('./synth')
const { launch, commentTemplate } = require('./puppet')
const { audioVideoCombine, combineVideos, copyVideo } = require('./video')

let sanitizeHtml = module.exports.sanitizeHtml = str => {
	foulSpanArray.forEach(reg => {
		str = str.replace(new RegExp(reg, 'gi'), '$1<span class="blur">$2</span>$3')
	})
	return str
}

function splitString(str) {
	return str
		.split(/<br>|(.+?[\.,?!]+["'\)\s]+)/g)
		.filter(d => d.replace('\u200B', ' ').trim().length > 0)
}

module.exports.splitString = splitString

let compileHtml = function (rootComment) {
	let id = 0
	let rec = commentTree => {
		let $ = cheerio.load(commentTree.body_html)

		$('p,li').addClass('text')
		$('li').addClass('hide-until-active') // To hide the list dots until they're needed

		// Removes .text class from all <p> with <li> children
		$('p li').parent('p').removeClass('text')
		$('li p').parent('li').removeClass('text')

		let tts = []

		let handle = function (arr, contents) {
			let lastWasTag = false
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
			console.log("Failed")
			console.error(e)
		}
	}
	return arr
}

function hydrateComment(comment, upvoteProb = 0.1) {
	comment.score = formatNum(comment.score)
	comment.created = timeAgo(comment.created_utc * 1000)
	if (comment.edited) {
		comment.edited = timeAgo(comment.edited * 1000)
	}
	if (comment.num_comments) {
		comment.num_comments = formatNum(comment.num_comments)
	}
	comment.silvers = comment.gildings.gid_1
	comment.golds = comment.gildings.gid_2
	comment.platina = comment.gildings.gid_3
	if (comment.replies) {
		comment.replies = comment.replies.map(hydrateComment)
	}
	comment.showBottom = true
	comment.upvoted = Math.random() < upvoteProb // Some of the posts will randomly be seen as upvoted

	return comment
}

// Should return the name of video of the created comment
module.exports.renderComment = async function renderComment(commentData, name) {
	let rootComment = hydrateComment(commentData, 0.1)

	let tts = compileHtml(rootComment)

	let workLine = []

	let markup = commentTemplate(rootComment)

	let $ = cheerio.load(markup)

	let ln = $('span.hide').length

	$('span.hide').each((i, _) => {
		let curr = $('.hide#' + i)
		curr.removeClass('hide')
		curr.parents('.hide-until-active').removeClass('hide-until-active') // Activate parent elements

		if (curr.is(':last-child') && curr.parentsUntil('.DIV_29').is(':last-child')) {
			// Is last segment of comment; display bottom
			curr.closest('.DIV_28').siblings('.DIV_31').removeClass('hide-until-active')
		}

		if (ln == i + 1) {
			$('.DIV_31.hide-until-active').removeClass('hide-until-active')
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
		.then(videos => {
			return combineVideos(videos.filter(v => v != null), name)
		})
}

module.exports.renderQuestion = function renderQuestion(questionData, renderMp4 = true) {
	let hydrated = hydrateComment(questionData, 0.5)

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
		.then(videos => combineVideos(videos, 'Q'))
		.then(() => {
			if (renderMp4) {
				copyVideo('../video-output/Q.mkv', '../Q.mp4')
			}
			return '../video-output/Q.mkv'
		})
}

function formatNum(num) {
	let d = parseInt(num)
	if (num >= 1000) {
		return Math.round(num / 100) / 10 + 'k'
	}
	return d
}