const puppeteer = require('puppeteer'),
	handles = require('handlebars'),
	fs = require('fs'),
	tmp = require('tmp'),
	path = require('path')

// Handlebar helper needed for inline comparisons in templates
handles.registerHelper('ifgt', function (val1, val2, options) {
	if (val1 > val2) {
		return options.fn(this);
	}
})

const questionTemplate = module.exports.questionTemplate = handles.compile(fs.readFileSync(path.join(__dirname, '/../html/question.html')).toString())
module.exports.commentTemplate = handles.compile(fs.readFileSync(path.join(__dirname, '/../html/comment-new.html')).toString())

let commentPartial = fs.readFileSync(path.join(__dirname, '/../html/comment-partial.html'), { encoding: 'utf-8' })
handles.registerPartial('comment', commentPartial)

let browser

module.exports.startInstance = async function startInstance() {
	if (!browser) {
		console.log('Starting puppeteer instance')

		browser = await puppeteer.launch({
			args: [
				'font-render-hinting=none'
			]
		})
	} else {
		console.log('Puppeteer already started')
	}
}

module.exports.startInstance()

async function launchComment(markup) {
	const page = await browser.newPage()

	await page.setContent(markup)

	let dsf = 2.4,
		pageWidth = 1920 / dsf,
		pageHeight = 1080 / dsf

	await page.setViewport({
		width: pageWidth,
		height: pageHeight,
		deviceScaleFactor: dsf,
	})

	let height = await page.$eval('.DIV_1', e => e.scrollHeight) // warning: 'body' doesn't work for some reason, gives the same value almost always

	await page.setViewport({
		width: pageWidth,
		height: height,
		deviceScaleFactor: dsf,
	})

	let file = tmp.fileSync({ postfix: '.png' })
	let filepath = file.name

	if (height * dsf > 1080) {
		// Expects there to be an element with class "center-elem", which is where it will put focus.
		let focus = await page.$eval('.center-elem', e => {
			let rect = e.getBoundingClientRect()
			return {
				y: rect.y,
				height: rect.height,
			}
		})

		let topPadding = focus.y + focus.height // top padding required to focus the current element

		let terracedTopPadding = topPadding - topPadding % (pageHeight * 0.8) - pageHeight * 0.1 // "Terrace" the top padding, causing it to only move when it needs to

		let y = Math.max(Math.min(terracedTopPadding, height - pageHeight), 0)

		await page.screenshot({
			encoding: 'binary',
			path: filepath,
			type: 'png',
			clip: {
				x: 0,
				y: y,
				width: pageWidth,
				height: pageHeight,
			},
		})
	} else {
		await page.screenshot({
			encoding: 'binary',
			path: filepath,
			type: 'png',
		})
	}

	page.close()

	return filepath
}

async function launchQuestion(context) {
	const page = await browser.newPage()
	let file = tmp.fileSync({ postfix: '.png' })
	let filepath = file.name

	let markup = questionTemplate(context)

	await page.setContent(markup)

	page.setViewport({
		width: 1920 / 3,
		height: 1080,
		deviceScaleFactor: 3,
	})

	const height = await page.$eval('#DIV_1', e => e.scrollHeight)

	page.setViewport({
		width: 1920 / 3,
		height: height,
		deviceScaleFactor: 3,
	})

	await page.screenshot({
		encoding: 'binary',
		path: filepath,
		type: 'png',
	})
	
	page.close()

	return filepath
}

module.exports.launchPuppet = function launch(type, context) {
	if (type == 'question') {
		return launchQuestion(context)
	}
	return launchComment(context)
}