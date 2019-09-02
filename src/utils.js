const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const { sanitizeHtml, sanitizeSynth } = require('./sanitize')

const splitCommentRegex = /((?:^|.)+?[.,?!]+[^\w\s]*\s+)/gm
let splitComment = module.exports.splitComment = function (str) {
	return str
		.split(splitCommentRegex)
		.filter(d => d.replace('\u200B', '').length > 0)
}

const splitQuestionRegex = /(.+?[^\w\s]+\s+)/
let splitQuestion = module.exports.splitQuestion = function (str) {
	return str
		.split(splitQuestionRegex)
		.filter(d => d.replace('\u200B', ' ').trim().length > 0)
}

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

	for (let count = 0; count < 50; count++) {
		let finalName = (count === 0 ? thread : `${thread}-${count}`) + fileExt
		let exists = fs.existsSync(path.join(dir, finalName))
		if (!exists) {
			return path.join(dir, finalName)
		}
	}

	return path.join(dir, origFileName) // Just return original file name
}

// Reddit-style points formatting
module.exports.formatPoints = function (num) {
	let d = parseInt(num)
	if (d >= 1000) {
		return Math.round(d / 100) / 10 + 'k'
	}
	return d.toString()
}

// Compiles Html by wrapping in span's and returns a tts transcript for every matching span
// rootComment needs a body_html and replies (array of other comments)
module.exports.compileHtml = function (rootComment, options = {}) {
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
				.map(d => `<span id="${id++}" class="hide">${d}</span>`)
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

module.exports.getFolderNames = function (dirPath) {
	let names = fs.readdirSync(dirPath) // Get all items of directory
		.filter(name => fs.lstatSync(path.join(dirPath, name)).isDirectory()) // Filter non-folders
	
	return names
}