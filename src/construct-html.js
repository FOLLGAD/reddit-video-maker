const tmp = require('tmp')
const cheerio = require('cheerio')
const { synthSpeech } = require('./synth')
const { launchPuppet, commentTemplate } = require('./puppet')
const { combineImageAudio, simpleConcat } = require('./video')
const { compileHtml, hydrate, compileQuestion } = require('./utils')

async function sequentialWork(works, { voice }) {
	let imgAudioArr = []
	for (let i = 0; i < works.length; i++) {
			let obj = works[i]
			let imgPromise = launchPuppet(obj.type, obj.imgObj)
			imgPromise.catch(console.error)
			let audioPromise = synthSpeech({ text: obj.tts, voice })
			audioPromise.catch(console.error)
			imgAudioArr[i] = [imgPromise, audioPromise]
	}

	let arr = []
	for (let i = 0; i < works.length; i++) {
		let obj = works[i]
		try {
			let start = Date.now()
			let file = tmp.fileSync({ postfix: '.mkv' })
			let path = file.name
			let [imgPath, audioPath] = await Promise.all(imgAudioArr[i])
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
		throw new Error("Comment: No segments succeeded.")
	}
	return arr
}

// Should return the name of video of the created comment
module.exports.renderComment = async function renderComment({
	commentData,
	voice,
}) {
	let rootComment = hydrate(commentData, 0.1)
	let tts = compileHtml(rootComment)
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
		} catch (e) {
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

	return await sequentialWork(workLine, { voice })
		.then(async videos => {
			let file = tmp.fileSync({ postfix: '.mkv' })
			let path = file.name
			await simpleConcat(videos.filter(v => v != null), path)
			return path
		})
}

module.exports.renderQuestion = function renderQuestion({
	questionData,
	voice,
}) {
	let hydrated = hydrate(questionData, 0.5)

	let $ = cheerio.load(hydrated.title)
	let text = $.text()

	$ = cheerio.load('<span class="text">' + text + '</span>')

	let tts = compileQuestion($)

	let workLine = []

	$('span.hide').each((i, _) => {
		$('.hide#' + i).removeClass('hide')
		let toRender = $.html()

		let obj = {
			imgObj: { ...hydrated, body_html: toRender },
			tts: cheerio.load(tts[i]).text(),
			type: 'question',
		}

		workLine.push(obj)
	})

	return sequentialWork(workLine, { voice })
		.then(async videos => {
			let file = tmp.fileSync({ postfix: '.mkv' })
			let path = file.name
			await simpleConcat(videos.filter(v => v != null), path)
			return path
		})
}
