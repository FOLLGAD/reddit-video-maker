const timeAgo = require('node-time-ago')
const cheerio = require('cheerio')
const { synthDaniel, foulSpanDictionary } = require('./synth')
const { launch } = require('./puppet')
const { audioVideoCombine, combineVideos, copyVideo } = require('./video')

let sanitizeHtml = module.exports.sanitizeHtml = str => {
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

module.exports.splitString = splitString

// Takes in a html element
// Edits $ in the code, and returns an array of all tts segments
function compileHtml($) {
	$('p,li').addClass('text')
	$('li').addClass('hide-list') // To hide the list dots until they're needed

	// Removes .text class from all <p> with <li> children
	$('p li').parent('p').removeClass('text')
	$('li p').parent('li').removeClass('text')

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
		}
	}
	return arr
}

// Should return the name of video of the created comment
module.exports.renderComment = async function renderCommentImgs(commentData, name) {
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
	console.log($.html())

	let tts = compileHtml($)

	let workLine = []
	let ln = $('span.hide').length

	$('span.hide').each((i, _) => {
		let curr = $('.hide#' + i)
		curr.removeClass('hide')
		curr.parents('.hide-list').removeClass('hide-list') // Show the parent list

		let toRender = $.html()

		let obj = {
			name: name + '-' + i,
			imgObj: { ...items, body_html: toRender, showBottom: i == ln - 1 },
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

module.exports.renderQuestion = function renderQuestion(questionData) {
	let items = {
		username: questionData.author,
		score: formatNum(questionData.score),
		time: timeAgo(questionData.created_utc * 1000), // Timezones are unimportant
		comments: formatNum(questionData.num_comments),

		body: questionData.title,

		silvers: questionData.gildings.gid_1,
		golds: questionData.gildings.gid_2,
		platina: questionData.gildings.gid_3,
	}

	let $ = cheerio.load(items.body)
	let text = $.text()

	$ = cheerio.load('<span class="text">' + text + '</span>')

	let tts = compileHtml($)

	let workLine = []
	let name = 'Q'

	$('span.hide').each((i, _) => {
		$('.hide#' + i).removeClass('hide')
		let toRender = $.html()

		let obj = {
			name: name + '-' + i,
			imgObj: { ...items, body_html: toRender },
			tts: cheerio.load(tts[i]).text(),
			type: 'question',
		}

		workLine.push(obj)
	})

	return sequentialWork(workLine)
		.then(videos => combineVideos(videos, 'Q'))
		.then(() => {
			copyVideo('../video-output/Q.mkv', '../Q.mp4')
			return '../video-output/Q.mkv'
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