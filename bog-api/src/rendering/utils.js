const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const timeAgo = require('node-time-ago')
const { sanitizeHtml, sanitizeSynth, sanitizeUsername } = require('./sanitize')

const splitCommentRegex = /((?:^|.)+?[.,?!]+[^\w\s]*\s+)/gm
let splitComment = module.exports.splitComment = function (str) {
	return str
		.split(splitCommentRegex)
		.filter(d => d.replace('\u200B', '').length > 0)
}

// const splitQuestionRegex = /(.+?[^\w\s]+\s+)/
// let splitQuestion = module.exports.splitQuestion = function (str) {
// 	return str
// 		.split(splitQuestionRegex)
// 		.filter(d => d.replace('\u200B', ' ').trim().length > 0)
// }

// Don't split quesiton at all
let splitQuestion = module.exports.splitQuestion = str => [str]

// Read a json data stream and turn into a js object
module.exports.readJsonBody = function (req) {
	return new Promise((res, rej) => {
		let body = ''
		req.on('data', chunk => {
			body += chunk
		})
		req.on('end', () => {
			let json = JSON.parse(body)
			res(json)
		})
	})
}

// Adds a number to origFileName until it finds one that doesnt exist in the given folder
module.exports.getBestName = function (origFileName, dir) {
	let lastDotIndex = origFileName.lastIndexOf('.')
	let fileExt = lastDotIndex !== -1 ? origFileName.slice(lastDotIndex) : "" // Get the file extension
	let thread = lastDotIndex !== -1 ? origFileName.slice(0, lastDotIndex) : origFileName

	let count = 0
	while (count < 10000) {
		count++
		let finalName = (count === 0 ? thread : `${thread}-${count}`) + fileExt
		let exists = fs.existsSync(path.join(dir, finalName))
		if (!exists) {
			return path.join(dir, finalName)
		}
	}

	return path.join(dir, origFileName) // Just return original file name
}

// Reddit-style points formatting
const formatPoints = function (num) {
	let d = parseInt(num)
	if (d >= 1000) {
		return (Math.round(d / 100) / 10).toFixed(1) + 'k'
	}
	return d.toString()
}

// Compiles Html by wrapping in span's and returns a tts transcript for every matching span
// rootComment needs a body_html and can optionally have replies (array of other comments)
// Mutates argument rootComment
module.exports.compileHtml = function (rootComment, keepLinks = false) {
	let id = 0

	let rec = commentTree => {
		let $ = cheerio.load(commentTree.body_html)

		$('p,li,blockquote').addClass('text')
		$('li,blockquote').addClass('hide-until-active') // To hide the list dots until they're needed

		// Removes .text class from all <p> with <li> children
		$('p li').parent('p').removeClass('text')
		$('p,li,blockquote').parents('p,li,blockquote').removeClass('text')

		if (!keepLinks) {
			// Remove links
			$('.text a').each(function () {
				$(this).contents().insertAfter($(this))
				$(this).remove()
			})
		}

		let tts = []

		let handle = function (arr, contents, isAChild = false, parentTags = []) {
			// Splits string on punctuation
			for (let i = 0; i < contents.length; i++) {
				let h = contents[i]
				let tag = h.name
				if (h.type == 'text') {
					let data = splitComment(h.data)

					if (data.length === 0) continue;

					let ttsData = data
					let htmlData = data

					if ($(h).closest('.no-censor').length === 0) {
						htmlData = data.map(sanitizeHtml)
						ttsData = ttsData.map(sanitizeSynth)
					}

					parentTags.forEach(pt => {
						if (["i", "strong", "b", "em", "mark", "small", "del", "ins", "u", "strike"].includes(pt)) {
							// If any of these, create an isolated tag for each section if needed
							htmlData = htmlData.map(d => `<${pt}>${d}</${pt}>`)
						}
					})

					if (isAChild && arr.length > 0 && tts.length > 0) {
						arr.push(arr.pop() + htmlData.shift())
						arr.push(...htmlData)
						tts.push(tts.pop() + ttsData.shift())
						tts.push(...ttsData)
					} else {
						arr.push(...htmlData)
						tts.push(...ttsData)
					}
				} else if (tag == 'br') {
					arr[arr.length - 1] += "<br>"
				} else {
					handle(arr, $(h).contents(), true, [tag].concat(parentTags))
				}
			}
		}

		$('.text').each((_, e) => {
			let arr = [],
				contents = $(e).contents()

			handle(arr, contents, true)

			// If (censoring is enabled), replace (the html of e) with (itself run through sanitizeHtml)
			let html = arr
				.map(d => `<span id="${id++}" class="hide body">${d}</span>`)
				.join('')

			$(e).html(html)
		})

		commentTree.body_html = $('body').html()

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
module.exports.compileQuestion = function ($) {
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

	let arr = [],
		contents = $('body').contents()

	handle(arr, contents)

	tts.push(...arr)
	tts = tts.map(sanitizeSynth) // Sanitize the Question title
	let html = arr
		.map(d => `<span id="q-${id++}" class="question hide">${d}</span>`)
		.map(sanitizeHtml)
		.join('')

	$('body').html(html)

	return tts
}

module.exports.getFolderNames = function (dirPath) {
	let names = fs.readdirSync(dirPath) // Get all items of directory
		.filter(name => fs.lstatSync(path.join(dirPath, name)).isDirectory()) // Filter non-folders

	return names
}

// Recursively "hydrate" all comments in the comment tree.
// Hydrating makes the data more fit for rendering and adds some extra data
module.exports.hydrate = function hydrate(comment, upvoteProb) {
	comment.score = formatPoints(comment.score)
	comment.created = timeAgo(comment.created_utc * 1000)
	if (comment.edited) {
		comment.edited = timeAgo(comment.edited * 1000)
	}
	if (comment.num_comments) {
		comment.num_comments = formatPoints(comment.num_comments)
	}
	if (comment.replies) {
		comment.replies = comment.replies.map(reply => hydrate(reply, upvoteProb))
	}
	comment.all_awardings = comment.all_awardings
		.slice(0, 2) // Only display the 3 first awards
		.map(d => ({
			is_enabled: d.is_enabled,
			count: d.count,
			icon_url: d.resized_icons[1].url, // Pick the 32x32 image (has index of 1)
		}))
	comment.showBottom = true
	comment.upvoted = Math.random() < upvoteProb // Some of the posts will randomly be seen as upvoted
	comment.authorHtml = sanitizeUsername(comment.author)

	return comment
}